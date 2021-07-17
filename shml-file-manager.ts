/*
MIT License

Copyright (c) 2021 SteveBeeblebrox

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

type StringObjectCollection = {
  [key: string]: string
}

type SHMLFileMetadata = {contents: string, flavor: string, version: string, encryption: string}

abstract class AbstractSHMLSource {
    static readonly NONE: string = 'NONE'

    contents: string
    flavor: string = 'SHML'
    version: string = '1.0.0'
    constructor({contents, flavor = 'SHML', version = '1.0.0'}: {contents: string, flavor: string, version: string}) {
            this.contents = contents
            const metadata: StringObjectCollection = {flavor, version}
            Object.keys(metadata).forEach(SHMLSource.validateProperty);
            Object.assign(this, metadata);
    }
    static validateProperty(property: string) {
        if(/[:\s]/.test(property)) throw `Illegal metadata value "${property}" for property "${property}". Whitespace and semicolons are not allowed.`
    }
}

class SHMLFile extends AbstractSHMLSource {

    encryption: string =  AbstractSHMLSource.NONE
    constructor({contents, flavor = 'SHML', version = '1.0.0', encryption = AbstractSHMLSource.NONE}: SHMLFileMetadata) {
        super({contents, flavor, version})
        SHMLSource.validateProperty(encryption)
        this.encryption = encryption
    }

    toString(): string {
        return `${this.flavor}::${this.version}::${this.encryption}\n${this.contents}`
    }

    isEncrypted(): boolean {
        return this.encryption !== 'NONE'
    }

    static async fromString(source: string): Promise<SHMLFile> {
        return new Promise((resolve, reject) => {
            source.replace(/(?:(?<metadata>[^:\s])){0}^(?<flavor>[^:\s]*?)::(?<version>[^:\s]*?)::(?<encryption>[^:\s]*?)(?:\r\n|\n)(?<contents>[\s\S]*)$/, function(...args: any[]): string {
                const map: SHMLFileMetadata = args.pop()
                resolve(new SHMLFile(map))
                return ''
            }).replace(/.*/, function(): string {
                reject('Unrecognized file format')
                return ''
            })
        })
    }
}

class SHMLSource extends AbstractSHMLSource {

}

type SHMLResult = {
}



type CryptographyFunction = {(text: string, password: string): Promise<string>}
  
type SHMLEncryptionTypes = {
    [key: string]: {
        encrypt: CryptographyFunction,
        decrypt: CryptographyFunction
    }
}

type ParserFunction = {
    (markup: string, ...args: any): SHMLResult
}
type VersionMapping = {
    [flavor: string]: {
        (version: string): ParserFunction | null
    }
}

type Predicate<T> = {
    (value: T): boolean
}



class SHMLFileManager {
    private encryptionTypes: SHMLEncryptionTypes
    private static simpleResolver = <T,>() => (value: T) => new Promise(resolve => resolve(value)) as Promise<T>
    constructor(public versionMapping: VersionMapping, encryptionTypes: SHMLEncryptionTypes = {}) {
        this.encryptionTypes = {
            'NONE': {
                encrypt: SHMLFileManager.simpleResolver<string>(),
                decrypt: SHMLFileManager.simpleResolver<string>()
            },
            ...encryptionTypes
        }
    }

    public canDecryptFile(file: SHMLFile): boolean {
        return Object.keys(this.encryptionTypes).includes(file.encryption!)
    }

    public canSupportSource(source: AbstractSHMLSource): boolean {
        return source.flavor! in this.versionMapping && this.versionMapping[source.flavor!](source.version!) !== null
    }

    public async decrypt(file: SHMLFile, password: string = ''): Promise<SHMLSource> {
        if(!this.canDecryptFile(file)) throw `Unsupported encryption type "${file.encryption}"`
        return new SHMLSource({
            contents: await this.encryptionTypes[file.encryption!].decrypt(file.contents!, password),
            flavor: file.flavor,
            version: file.version
        })
    }

    public async encrypt(file: SHMLSource, encryption: string = 'NONE', password: string = ''): Promise<SHMLFile> {
        return new SHMLFile({
            contents: await this.encryptionTypes[encryption].encrypt(file.contents!, password),
            flavor: file.flavor,
            version: file.version,
            encryption: encryption
        })
    }

    public async fromFile(source: string | SHMLFile, password: string = ''): Promise<SHMLSource> {
        if(typeof source === 'string' || source instanceof String) source = await SHMLFile.fromString(source as string)
        if(!this.canSupportSource(source)) throw 'Unsupported file type or version'
        return await this.decrypt(source, password)
    }

    public async toFile(source: SHMLSource, encryption: string = AbstractSHMLSource.NONE, password: string = ''): Promise<SHMLFile> {
        return this.encrypt(source, encryption, password)
    }

    public async parse(source: SHMLSource): Promise<string> {
        if(!this.canSupportSource(source)) throw 'Unsupported file type or version'
        return (this.versionMapping[source.flavor](source.version) ?? (function() {return ''}))(source.contents) as string;
    }
}
