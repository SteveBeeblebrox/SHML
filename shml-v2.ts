console.clear()

function cyrb64(text: string, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < text.length; i++) {
        ch = text.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    return (h2>>>0).toString(16).padStart(8,'0')+(h1>>>0).toString(16).padStart(8,'0');
}

namespace UnicodeHelper {
    const throws = (e: any) => {throw e}

    export const NONCHARACTERS = Object.freeze([...function* generate() {
        for(let plane = 0;  plane < 16; plane++) {
            yield 0xfffe + 0x10000 * plane
            yield 0xffff + 0x10000 * plane
        }
        yield 0x10fffe
        yield 0x10fffe
        for(let codepoint = 0xfdd0; codepoint < 0xfdd0 + 32; codepoint++)
            yield codepoint
    }()].map(o=>String.fromCodePoint(o)))

    const noncharacterIterator = (function* f() {
        for(const noncharacter of UnicodeHelper.NONCHARACTERS) yield noncharacter;
    })();
   
    export function nextNoncharacter() {
        return noncharacterIterator.next().value ?? throws('No more noncharacters')
    }

    export function isInvalid(text: string) {
        return new RegExp(`[${UnicodeHelper.NONCHARACTERS.join('')}]`).test(text)
    }

    export const
        INLINE_MARKER = nextNoncharacter(),
        BLOCK_MARKER = nextNoncharacter(),
        // @ts-expect-error
        HEXADECIMAL_MAPPING = Object.fromEntries(Array.apply(null, {length:16}).map((_,i) => [i.toString(16), nextNoncharacter()]))
}

const HASHTABLE = {} as {[key: string]:Block}

function Block(blockType: string, inline = true) {
    return function(text: string/*...args: any[]*/) {
       // const text = args[0]
        //console.log(args)
        const
            marker = inline && UnicodeHelper.INLINE_MARKER || UnicodeHelper.BLOCK_MARKER,
            hash = `${marker}${cyrb64(text).split('').map(o=>UnicodeHelper.HEXADECIMAL_MAPPING[o]).join('')}${marker}`
        HASHTABLE[hash] = {blockType, text}
        return hash
    }
}

type Block = {blockType: string, text: string, groups?: any}

function parse(text: string, args: [RegExp, string, boolean][], reviver: {(block: Block): string}): string {
    if(UnicodeHelper.isInvalid(text)) throw 'Invalid Unicode Noncharacters present in text'
   
    for(const [pattern, blockType, isInline] of args)
        text = text.replace(pattern, Block(blockType, isInline))

    while(text.includes(UnicodeHelper.INLINE_MARKER) || text.includes(UnicodeHelper.BLOCK_MARKER))
        text = text.replace(/([\ufffe\uffff]).*?\1/, m => reviver(HASHTABLE[m]))  

    return text;
}


console.log(parse(`Wow, *Hello --c*o*de-- __W__orld*!`, [
    [/--(.*?)--/g, 'code', true],
    [/__(.*?)__/g, 'ul', true],
    [/\*(?<header>.*?)\*/g, 'h1', false],
], restore))


function restore({blockType, text}: Block): string {
    switch(blockType) {
        case 'code': return `<pre><code>${text}</code></pre>`
        default: return `<${blockType}>${text}</${blockType}>`
    }
}
