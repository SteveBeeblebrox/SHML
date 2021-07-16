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

type SHMLFileMetadata = {contents: string, flavor?: string, version?: string, encryption?: string}

type CryptographyFunction = {(text: string, password: string): Promise<string>}
  
type SHMLEncryptionTypes = {
    [key: string]: {
        encrypt: CryptographyFunction,
        decrypt: CryptographyFunction
    }
}

class SHMLFile {
    isEncrypted(): boolean {
        return this.encryption !== 'NONE'
    }
    toString(): string {
        return `${this.flavor}::${this.version}::${this.encryption}\n${this.contents}`
    }
    public contents?:string
    public flavor?:string
    public version?:string
    public encryption?: string
    constructor({contents, flavor = 'SHML', version = '1.0.0', encryption = 'NONE'}: SHMLFileMetadata) { 
        const metadata: StringObjectCollection = {flavor, version, encryption}
        Object.keys(metadata).forEach(property => {
            if(/[:\s]/.test(metadata[property])) throw `Illegal metadata value "${metadata[property]}" for property "${property}". Whitespace and semicolons are not allowed.`
        });
        Object.assign(this, {contents, ...metadata})
    }

    static async fromString(source: string): Promise<any> {
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

class SHMLFileCryptographyHandler {
    private encryptionTypes: SHMLEncryptionTypes
    private static simpleResolver = <T,>() => (value: T) => new Promise(resolve => resolve(value)) as Promise<T>
    constructor(encryptionTypes: SHMLEncryptionTypes = {}) {
        this.encryptionTypes = {
            'NONE': {
                encrypt: SHMLFileCryptographyHandler.simpleResolver<string>(),
                decrypt: SHMLFileCryptographyHandler.simpleResolver<string>()
            },
            ...encryptionTypes
        }
    }

    public canDecryptFile(file: SHMLFile): boolean {
        return Object.keys(this.encryptionTypes).includes(file.encryption!)
    }

    public async decrypt(file: SHMLFile, password: string): Promise<SHMLFile> {
        if(!this.canDecryptFile(file)) throw `Unsupported encryption type "${file.encryption}"`
        return new SHMLFile({
            contents: await this.encryptionTypes[file.encryption!].decrypt(file.contents!, password),
            flavor: file.flavor,
            version: file.version,
            encryption: 'NONE'
        })
    }

    public async ecrypt(file: SHMLFile, password: string, encryption: string = 'NONE'): Promise<SHMLFile> {
        return new SHMLFile({
            contents: await this.encryptionTypes[encryption].encrypt(file.contents!, password),
            flavor: file.flavor,
            version: file.version,
            encryption: encryption
        })
    }
}
