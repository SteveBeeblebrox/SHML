//<!> WIP, not ready to use <!>
type StringObjectCollection = {
  [key: string]: string;
}

function splitOnFirst(source: string, seperator: RegExp): RegExpMatchArray & { groups?: StringObjectCollection} {
    const match = source.match(seperator)
    match?.push(source.slice(match.shift()!.length + match.index!, source.length))
    match?.unshift(source.slice(0, match.index))
    return match ?? ['', source];
}

class BaseNode {
    constructor(public name: string, public children: BaseNode[], public metadata: StringObjectCollection, public parent: BaseNode | null) {
        for(const child of children)
            child.parent = this
    }
}

class TextNode extends BaseNode {
    constructor(textContent: string, parent: BaseNode | null) {
        super('TEXT', [], {textContent}, parent);
    }
}

function toSourceString(node: BaseNode): string {
    switch(node.name) {
        case 'TEXT': return node.metadata['textContent'];
        case 'inline': {
            const tag = (function() {
                    switch(node.metadata.what) {
                    case '**': return 'strong';
                    case '__': return 'ul';
                    default: return ''
                }
            })()
            return `<${tag}>${node.children.map(toSourceString).join('')}</${tag}>`;
        }
        case 'mark': return `<mark>${node.children.map(toSourceString).join('')}</mark>`;
        default: return node.children.map(toSourceString).join('');
    }
}

type Args = {
    [name: string]: RegExp
}

function collectNodes(node: BaseNode): BaseNode[] {
    return [node, ...node.children.map(collectNodes).flat()]
}

function parse(source: string, passes: Args): string {
    const root = new BaseNode('ROOT', [], {}, null)
    root.children = [new TextNode(source, root)]

    let killCounter = 0;
    
    for(const pass of Object.keys(passes)) {
        const textNodes = collectNodes(root).filter(node => node instanceof TextNode)
        for(const node of textNodes) {
            const {textContent} = node.metadata;
            const {parent} = node;
            let array = splitOnFirst(textContent, passes[pass]);
            
            if(array.length === ['', 'source'].length) continue

            killCounter++;
            if(killCounter > 15) break;
            
            const front = new TextNode(array.shift()!, parent!)
            const back = new TextNode(array.pop()!, parent!)
            
            const children = []
            const metadata = array.groups ?? {};
            if('content' in metadata && metadata.content) children.push(new TextNode(metadata.content, null))

            const middle = new BaseNode(pass, children/*array.map(str => new TextNode(str, parent!)).filter(n => n.metadata.textContent)*/, array.groups ?? {}, parent!)

            const nodes = [middle]
            if(front.metadata.textContent !== '') {
                textNodes.push(front)
                nodes.unshift(front)
            }
            
            for(const child of middle.children)
                textNodes.push(child)

            if(back.metadata.textContent) {
                textNodes.push(back)
                nodes.push(back)
            }

            parent!.children.splice(parent!.children.indexOf(node), 1, ...nodes);

        }
        
/*console.log(JSON.stringify(root, function(key, value) {
    if(key !== 'parent') return value
    return value?.name ?? "None (Top)"
}, 2))*/
    }

    return toSourceString(root)
}

console.log(parse(`**He|l|lo** big **Wo__r__ld**!`,
    {
        'inline': /(?<what>\*\*|__)(?<content>.*?)\1/,
        'mark': /\|(.*?)\|/
    }
))
