// <!> WARNING: Experimental Code <!>
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

class ASTNode {
    parent?: ASTNode
   constructor(public contents: string, public children: ASTNode[]) {
   }
   appendChild(child: ASTNode) {
       child.parent = this
       this.children.push(child)
   }
   toSourceString(): string {
      return this.children.length === 0 ? this.contents : this.children.map(node => node.toSourceString()).join('')
   }
}

class ASTTagNode extends ASTNode {
   constructor(public tag: string, contents: string, children: ASTNode[]) {
      super(contents, children)
   }
   toSourceString(): string {
      return `<${this.tag}>${super.toSourceString()}</${this.tag}>`
   }
}

class ASTCommentNode extends ASTNode {
    constructor(public readonly comment: string) {
        super('', [])
    }
    toSourceString(): string {
        return `<!-- ${this.comment} -->`
    }
}

class ASTRoot {
    first: ASTNode
    descendants: ASTNode[]
    properties: Map<string,string>
    constructor(first: ASTNode) {
        this.first = first
        this.descendants = [first]
        this.properties = new Map<string, string>();
   }
   toSourceString(): string {
        return this.first.toSourceString()
   }
   static from(source: string) {
        return new ASTRoot(new ASTNode(source, []))
   }
}

class SHMLResult {
    constructor(private readonly root: ASTRoot) {

    }

    getProperties(): StringObjectCollection {
        throw new Error("Method not implemented.")
    }

    getProperty(): StringObjectCollection {
        throw new Error("Method not implemented.")
    }

    getIds():  string[] {
        throw new Error("Method not implemented.")
    }

    toString(): string {
        return this.root.toSourceString()
    }

    toHTML(): any {
        throw new Error("Method not implemented.")
    }
}

type StringObjectCollection = {
  [key: string]: string;
}

function escapeRegExpLiteral(literal: string): string {
    return literal.replace(/[\\[\]{}()^$.?+*|]/g, '\\$&').replace(/-/g, '\\x2d')
}

function attriutesToString(properties: {[key: string]: string | object}) {
	properties = {...properties}
	if('style' in properties && typeof properties.style === 'object')
  	   properties.style = Object.entries(properties.style).map(([key, value]) => `${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}:${value};`).join('')
  
   return ' ' + Object.entries(properties).map(([key, value]) => `${key}="${value.toString().replace(/"/g, "&quot;")}"`).join(' ')
}

type Supplier<T> = {
    (): T
}

export interface SHMLPass {
    parse(root: ASTRoot): ASTRoot
}

export class SectionPass implements SHMLPass {
    private readonly getRegex: Supplier<string | RegExp>
    private readonly getPasses: Supplier<number>
    constructor(regex: string | RegExp | Supplier<string | RegExp>, private readonly accept: {(map: StringObjectCollection): ASTNode | null}, passes: number | Supplier<number> = () => 1) {
        this.getRegex = SectionPass.asSupplier(regex, value => typeof value === 'string' || value instanceof RegExp)
        this.getPasses = SectionPass.asSupplier(passes, value => typeof value === 'number')
    }
    
    private static asSupplier<T>(value: Supplier<T> | T, isValue: {(value: Supplier<T> | T): boolean}): Supplier<T> {
        return isValue(value) ? () => value as T : value as Supplier<T>
    }

    private static asString(regex: RegExp | string): string {
        if(typeof regex === 'string') return regex

        const str = regex.toString()
        return str.substring(1, str.length - 1 - regex.flags.length)
    }

    parse(root: ASTRoot): ASTRoot {
        const regex = new RegExp(`(?<front>.*?)${SectionPass.asString(this.getRegex())}`)
        for(const pass of Array(this.getPasses()).keys())
            for(let node of root.descendants) {

                let source = node.contents
                
                if(!regex.test(source)) continue

                node.contents = ''
                
                let previous = source

                const replacer = (...args: any[]) => {
                    const map = args.pop();

                    root.descendants = root.descendants.filter(o => o !== node)

                    if(map.front !== '') {
                        const frontNode = new ASTNode(map.front, [])
                        node.children.push(frontNode)
                        root.descendants.push(frontNode)
                    }

                    delete map.front

                    const targetNode = this.accept(map)
                    if(targetNode) {
                        node.children.push(targetNode)
                        root.descendants.push(targetNode)
                    }
                    return ''
                }

                while ((source = source.replace(regex, replacer)) !== previous) previous = source

                if(source === '') continue

                const backNode = new ASTNode(source, [])
                node.children.push(backNode)
                root.descendants.push(backNode)
            }
        return root
    }
}

export class SHMLInstance {
    private readonly passes: SHMLPass[]
    constructor(...passes: SHMLPass[]) {
        this.passes = passes
    }

    parse(source: string) : SHMLResult {
        let root = ASTRoot.from(source)
        for(const pass of this.passes)
            root = pass.parse(root)
        return new SHMLResult(root)

    }
}

export class PassCollection implements SHMLPass {
    private readonly passes: SHMLPass[]
    constructor(...passes: SHMLPass[]) {
        this.passes = passes
    }
    parse(root: ASTRoot): ASTRoot {
        for(const pass of this.passes) root = pass.parse(root)
        return root
    }
}

export class Passes {
    static readonly HASHTAG_HEADERS = new SectionPass(/(?<what>#{1,6})\s(?<contents>.*?)\n/, function(map: StringObjectCollection) {
        return new ASTTagNode('h' + map.what.length, map.contents, [])
    })

    static readonly BASIC_HEADERS = new SectionPass(/h(?<what>[1-6]):\s(?<contents>.*?)\n/, function(map: StringObjectCollection) {
        return new ASTTagNode('h' + map.what, map.contents, [])
    })

    static readonly HEADERS = new PassCollection(Passes.HASHTAG_HEADERS, Passes.BASIC_HEADERS)

    static readonly PARAGRAPH = new SectionPass(/p:\s(?<contents>.*?)\n/, function(map: StringObjectCollection) {
        return new ASTTagNode('p', map.contents, [])
    })

    static readonly INLINE_SUBSET = (args: {[key: string]: string | {(contents: string): ASTTagNode}}) =>
        new SectionPass(new RegExp(`(?<what>${Object.keys(args).map(escapeRegExpLiteral).join('|')})(?<contents>.*?)\\k<what>`), function(map: StringObjectCollection) {
            const tag = args[map.what] ?? 'span'
            return typeof tag === 'string' ? new ASTTagNode(tag, map.contents, []) : tag(map.contents)
        }, Object.keys(args).length)
    
    static readonly INLINE = Passes.INLINE_SUBSET({
        '***': (contents: string) => {
            const node = new ASTTagNode('strong', '', [])
            node.appendChild(new ASTTagNode('em', contents, []))
            return node
        },
        '**': 'strong',
        '*': 'em',
        '|': 'mark',
        '__': 'u',
        '~~': 'del',
        ',,': 'sub',
        '^^': 'sup'
    })

    static readonly SOURCE_COMMENTS = new SectionPass(/!!!\s(?<contents>.*?)\n/, function(map: StringObjectCollection) {
        return null
    })

    static readonly STANDARD_COMMENTS = new SectionPass(/!!\s(?<contents>.*?)\n/, function(map: StringObjectCollection) {
        return new ASTCommentNode(map.contents)
    })

    static readonly COMMENTS = new PassCollection(Passes.SOURCE_COMMENTS, Passes.STANDARD_COMMENTS)
}

export function parse(source: string): SHMLResult {
    return new SHMLInstance(Passes.HEADERS, Passes.PARAGRAPH, Passes.INLINE).parse(source)
}

console.log(new SHMLInstance(
    Passes.COMMENTS,
    Passes.HEADERS,
    Passes.PARAGRAPH,
    Passes.INLINE
).parse(
`# Hello World
!!! Comment
h2: H2
p: |w**o**w| *** oOo ***`
).toString())
