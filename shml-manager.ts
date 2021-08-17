type SHMLResult = any
type EncryptionTransform = {(source: string, password: string): Promise<string> | string}
type Transform<T> = {(t: T): Promise<T> | T}

type TransformerMap<T extends Function> = {
    [key: string]: {
        transform: T
        detransform: T
    }
}

class SHMLFileInfo {
    constructor(
        public flavor: string,
        public version: Version,
        public contents: string,
        public compression: string = SHMLManager.NONE,
        public encryption: string = SHMLManager.NONE,
        public hashbang?: string,
    ) {}
}

class ParseableSHMLFileInfo extends SHMLFileInfo{
    constructor(
        private parse: (data: SHMLFileInfo) => SHMLResult,
        flavor: string,
        version: Version,
        contents: string,
        compression?: string,
        encryption?: string,
        hashbang?: string,
    ) {
        super(flavor, version, contents, compression, encryption, hashbang)
    }

    toSHML() {
        return this.parse(this)
    }
}

type Supplier<T> = {
    (): T
}

type SHMLSupplier = {
    (flavor: string, version: Version): {
        (source: string): SHMLResult
    } | null
}

class Version {
    constructor(
        public readonly major: number,
        public readonly minor: number,
        public readonly patch: number,
        public readonly prerelease?: string,
        public readonly buildmetadata?: string
    ) {}

    toString() {
        let result = `${this.major}.${this.minor}.${this.patch}`
        if(this.prerelease) result += `-${this.prerelease}`
        if(this.buildmetadata) result += `+${this.buildmetadata}`
        return result
    }

    static fromStrings(major: string, minor: string, patch: string, prerelease?: string, buildmetadata?: string) {
        let numbers = [major, minor, patch].map(str => parseInt(str, 10))
        if(numbers.some(number => isNaN(number))) throw 'Invalid version string.'
        return new Version(numbers[0], numbers[1], numbers[2], prerelease, buildmetadata)
    }
}

class SHMLManager {
    static readonly PATTERN = /^(?<hashbang>#!.*?\n)?:(?<flavor>[A-Z-]*?):(?:(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?):(?:(?<compression>[A-Z-]*?):)?(?:(?<encryption>[A-Z-]*?):)?\n(?<contents>[\s\S]*)/
    static readonly NONE = 'NONE'
    static readonly NO_TRANSFORM = ((a: any) => a) as Transform<any>

    constructor(private readonly getParser: SHMLSupplier, private readonly compression: TransformerMap<Transform<string>> = {}, private readonly encryption: TransformerMap<EncryptionTransform> = {}) {
        this.compression[SHMLManager.NONE] = this.encryption[SHMLManager.NONE] = {
            transform: SHMLManager.NO_TRANSFORM,
            detransform: SHMLManager.NO_TRANSFORM
        }
    }

    async read(source: string, passwordSupplier?: Supplier<Promise<string | undefined | null> | string | undefined | null> | string): Promise<ParseableSHMLFileInfo> {
        const match: any = SHMLManager.PATTERN.exec(source)

        if(match === null) throw 'Invalid file.'

        const compressionType: string = match.groups!.compression ?? SHMLManager.NONE 
        const encryptionType: string = match.groups!.encryption ?? SHMLManager.NONE

        let password: string | undefined | null = undefined
        if(encryptionType !== SHMLManager.NONE) {
            if(!passwordSupplier) throw 'A password is required to read this file and no supplier was provided.'
            if(typeof passwordSupplier === 'string')
                password = passwordSupplier
            else
            password = await passwordSupplier()
            if(!password) throw 'A password is required to read this file and none was provided.'
        }

        const flavor: string = match.groups!.flavor!
        const version = Version.fromStrings(
            match.groups.major,
            match.groups.minor,
            match.groups.patch,
            match.groups.prerelease,
            match.groups.buildmetadata
        )

        const compressionManager = this.compression[compressionType]
        if(!compressionManager) throw `Unsupported compression type ${compressionType}.`

        const encryptionManager = this.encryption[encryptionType]
        if(!encryptionManager) throw `Unsupported encryption type ${encryptionType}.`
        
        const contents =
            await encryptionManager.detransform(
                await compressionManager.detransform(
                    match.groups!.contents!
                ),
                password!
            )

        return new ParseableSHMLFileInfo((data) => {
            const parse = this.getParser(data.flavor, data.version)
            if(!parse) throw `Unsupported flavor ${flavor} ${version.toString()}`
            return parse(data.contents)
        }, flavor, version, contents, compressionType, encryptionType, match.groups.hashbang)
    }

    async write(source: SHMLFileInfo, passwordSupplier?: Supplier<Promise<string | undefined | null> | string | undefined | null> | string): Promise<string> {
        const compressionType: string = source.compression
        const encryptionType: string = source.encryption

        let password: string | undefined | null = undefined
        if(encryptionType !== SHMLManager.NONE) {
            if(!passwordSupplier) throw 'A password is required to read this file and no supplier was provided.'
            if(typeof passwordSupplier === 'string')
                password = passwordSupplier
            else
            password = await passwordSupplier()
            if(!password) throw 'A password is required to read this file and none was provided.'
        }

        const compressionManager = this.compression[compressionType]
        if(!compressionManager) throw `Unsupported compression type ${compressionType}.`

        const encryptionManager = this.encryption[encryptionType]
        if(!encryptionManager) throw `Unsupported encryption type ${encryptionType}.`
        
        const contents =
            await compressionManager.transform(
                await encryptionManager.transform(
                    source.contents,
                    password!
                ),
            )

        let header = `${source.hashbang ?? ''}:${source.flavor}:${source.version.toString()}:`
        if(encryptionType !== SHMLManager.NONE) header += `${compressionType}:${encryptionType}:`
        else if(compressionType !== SHMLManager.NONE) header += `${compressionType}:`
        return `${header}\n${contents}`
    }
}
