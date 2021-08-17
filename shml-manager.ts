interface Parseable {
    toSHML(): any
}

type EncryptionTransform = {(source: string, password: string): Promise<string> | string}
type Transform<T> = {(t: T): Promise<T> | T}

type TransformerMap<T extends Function> = {
    [key: string]: {
        transform: T
        detransform: T
    }
}

class SHMLManager {
    static readonly PATTERN = /^(?<hashbang>#!.*?\n)?:(?<flavor>[A-Z-]*?):(?:(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?):(?<compression>[A-Z-]*?):(?<encryption>[A-Z-]*?):\n(?<contents>[\s\S]*)/
    static readonly NONE = 'NONE'
    static readonly NO_TRANSFORM = ((a: any) => a) as Transform<any>

    constructor(private readonly compression: TransformerMap<Transform<string>> = {}, private readonly encryption: TransformerMap<EncryptionTransform> = {}) {
        this.compression[SHMLManager.NONE] = this.encryption[SHMLManager.NONE] = {
            transform: SHMLManager.NO_TRANSFORM,
            detransform: SHMLManager.NO_TRANSFORM
        }
    }

    async read(source: string, password?: string) {
        const match: any = SHMLManager.PATTERN.exec(source)
        const err = (arg?: any) => {throw arg}
        
        if(match === null) err('Invalid file.')
        const metadata = {
            flavor: match.flavor,
            version: {
                major: match.groups.major,
                minor: match.groups.minor,
                patch: match.groups.patch,
                prerelease: match.groups.prerelease,
                buildmetadata: match.groups.buildmetadata
            }
        }

        const compressionType = match.groups.compression ?? SHMLManager.NONE 
        const encryptionType = match.groups.encryption ?? SHMLManager.NONE

        if(encryptionType !== SHMLManager.NONE && !password) err('A password is required to read this file and none was provided.')


        const compressionManager = this.compression[compressionType] ?? err(`Unsupported compression type ${compressionType}.`)
        const encryptionManager = this.encryption[encryptionType] ?? err(`Unsupported encryption type ${encryptionType}.`)

        return await encryptionManager.detransform(
            await compressionManager.detransform(
                match.groups.contents
            ),
            password!
        )
    }
}
