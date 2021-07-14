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
   contents: string
   children: ASTNode[]
   constructor(contents: string, children: ASTNode[]) {
      this.contents = contents
      this.children = children
   }
   toSourceString(): string {
      return this.children.length === 0 ? this.contents : this.children.map(node => node.toSourceString()).join('')
   }
}

class ASTTagNode extends ASTNode {
   tag: string
   constructor(tag: string, contents: string, children: ASTNode[]) {
      super(contents, children)
      this.tag = tag
   }
   toSourceString(): string {
      return `<${this.tag}>${super.toSourceString()}</${this.tag}>`
   }
}

class ASTRoot {
   first: ASTNode
   descendants: ASTNode[]
   constructor(first: ASTNode) {
      this.first = first
      this.descendants = [first]
   }
   toSourceString(): string {
      return this.first.toSourceString()
   }
}

type StringObjectCollection = {
  [key: string]: string;
}

function escapeRegExpLiteral(literal: string): string {
    return literal.replace(/[\\[\]{}()^$.?+*|]/g, '\\$&').replace(/-/g, '\\x2d')
}

class SimpleSHMLNodeParser {
   constructor(private readonly config: StringObjectCollection) {

   }
   parse(root: ASTRoot) : any {
      let k = 0;
      for(let pass = 0; pass <= Object.keys(this.config).length; pass++)
         for(let node of root.descendants) {

            if(k++ > 25) break;

            let source = node.contents

            node.contents = ''

            const regex = new RegExp(`(?<rest>.*?)(?<what>${Object.keys(this.config).map(escapeRegExpLiteral).join('|')})(?<target>.*?)\\k<what>`)

            let i = 0;
            let previous = source
            const func = (...args: any[]) => {
               const map = args.pop();

               root.descendants = root.descendants.filter(o => o !== node)

               if(map.rest !== '') {
                  const rest = new ASTNode(map.rest, [])
                  node.children.push(rest)
                  root.descendants.push(rest)
               }

               let tag: string = this.config[map.what] ?? 'span'

               const target = new ASTTagNode(tag, map.target, [])
               node.children.push(target)
               root.descendants.push(target)

               return ''
            }
            while ((source = source.replace(regex, func)) !== previous && i++ < 10) previous = source

            if(source === '') continue

            const fin = new ASTNode(source, [])
            node.children.push(fin)
            root.descendants.push(fin)

         }

      return root;
   }
}

function findParent(root: ASTRoot, node: ASTNode): ASTNode {
   return root.descendants.find(decendant => decendant.children.includes(node)) ?? root.first
}

let parser = new SimpleSHMLNodeParser({
   '**': 'strong',
   '*': 'em',
   '|': 'mark',
   '__': 'u',
   '~~': 'del',
   ',,': 'sub',
   '^^': 'sup'
})
let root = /*parser.parse(*/parser.parse(new ASTRoot(new ASTNode('|~~__o__~~| __o|~~O~~|o__ **Test** This is *wow*! |I| *l|ov|e* it. Does |th*i*s| work? __o|O|o__ ~~bye~~ H,,2,,O x^^*2*^^', [])))//)
console.log(root.first)
console.log(root.toSourceString())
console.log(root.descendants.filter((n: ASTNode) => n.children.length == 0 && n.contents === ''))
console.log('Source Length: ' + root.descendants.length)
