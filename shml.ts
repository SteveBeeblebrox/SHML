/*
 * MIT License
 * Copyright (c) 2020-2022 S. Beeblebrox
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

namespace SHML {
    export const VERSION: Readonly<{major: number, minor: number, patch: number, metadata?: string, prerelease?: string, toString(): string}> = Object.freeze({
        toString() {return `${VERSION.major}.${VERSION.minor}.${VERSION.patch}${VERSION.prerelease !== undefined ? `-${VERSION.prerelease}` : ''}${VERSION.metadata !== undefined ? `+${VERSION.metadata}` : ''}`},
        major: 1, minor: 6, patch: 3
    });

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
            HEXADECIMAL_MAPPING = Object.fromEntries(Array.apply(null,
                    {length:16} as unknown[]
                ).map((_,i) => [i.toString(16), nextNoncharacter()]))
    }

    type Block = {blockType: string, text: string, groups?: any}
    type FormatArgs = Map<string, {pattern: RegExp, isInline?: boolean, reviver?: {(block: Block, decode:(text:string)=>string): string}}>

    function abstractParse(text: string, args: FormatArgs) {
        if(UnicodeHelper.isInvalid(text)) throw 'Invalid Unicode Noncharacters present in text'
        
        text = text.replace(/[<>&"']/g, match => {
            switch(match) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '"': return '&quot;';
                case '\'': return '&#x27;';
                
                default: throw null;
            }
        })

        const hashmap = new Map<string, Block>()
        
        function parseLevel(text: string, args: FormatArgs): string {
            for(const [blockType, {pattern, isInline}] of args.entries())
                text = text.replace(pattern, (...strings: any): string => {
                    const 
                        text = strings[0],
                        lastArg = strings[strings.length-1],
                        groups = typeof lastArg === 'object' ? lastArg : undefined,
                        marker = (isInline ?? true) && UnicodeHelper.INLINE_MARKER || UnicodeHelper.BLOCK_MARKER,
                        hash = `${marker}${cyrb64(text).split('').map(o=>UnicodeHelper.HEXADECIMAL_MAPPING[o]).join('')}${marker}`
                    

                    for(const [key, value] of Object.entries(groups ?? {}) as [string, string][]) {
                        if(key.toUpperCase() === key)
                            groups[key] = parseLevel(value, new Map([...args.entries()].filter(([argBlockType]) => argBlockType !== blockType)))
                    }

                    hashmap.set(hash, {blockType, text: text, groups})

                    return hash
                })
            return text
        }
        function decode(text: string) {
            while(text.includes(UnicodeHelper.INLINE_MARKER) || text.includes(UnicodeHelper.BLOCK_MARKER))
                text = text.replace(/([\ufffe\uffff]).*?\1/, hash => {
                    const block = hashmap.get(hash)!;
                    return (args.get(block.blockType)!.reviver ?? (({blockType, groups}) => `<${blockType}>${groups.TEXT}</${blockType}>`))(block, decode)
                })
            return text
        }

        return decode(parseLevel(text, args));
    }

    namespace Configuration {
        export const SYMBOLS: {[key: string]: {[key: string]: string}} = {
            '~': {'A': 'Ã', 'I': 'Ĩ', 'N': 'Ñ', 'O': 'Õ', 'U': 'Ũ', 'a': 'ã', 'i': 'ĩ', 'n': 'ñ', 'o': 'õ', 'u': 'ũ'},
            ':': {'A': 'Ä', 'E': 'Ë', 'I': 'Ï', 'O': 'Ö', 'U': 'Ü', 'Y': 'Ÿ', 'a': 'ä', 'e': 'ë', 'i': 'ï', 'o': 'ö', 'u': 'ü', 'y': 'ÿ'},
 /*'*/ '&#x27;': {'A': 'Á', 'C': 'Ć', 'E': 'É', 'I': 'Í', 'L': 'Ĺ', 'N': 'Ń', 'O': 'Ó', 'R': 'Ŕ', 'S': 'Ś', 'U': 'Ú', 'Y': 'Ý', 'Z': 'Ź', 'a': 'á', 'c': 'ć', 'e': 'é', 'g': 'ǵ', 'i': 'í', 'l': 'ĺ', 'n': 'ń', 'o': 'ó', 'r': 'ŕ', 's': 'ś', 'u': 'ú', 'y': 'ý', 'z': 'ź'},
 /*"*/ '&quot;': {'O': 'Ő', 'U': 'Ű', 'o': 'ő', 'u': 'ű'},
            '`': {'A': 'À', 'E': 'È', 'I': 'Ì', 'O': 'Ò', 'U': 'Ù', 'a': 'à', 'e': 'è', 'i': 'ì', 'o': 'ò', 'u': 'ù'},
            '^': {'A': 'Â', 'C': 'Ĉ', 'E': 'Ê', 'G': 'Ĝ', 'H': 'Ĥ', 'I': 'Î', 'J': 'Ĵ', 'O': 'Ô', 'S': 'Ŝ', 'U': 'Û', 'W': 'Ŵ', 'Y': 'Ŷ', 'a': 'â', 'c': 'ĉ', 'e': 'ê', 'g': 'ĝ', 'h': 'ĥ', 'i': 'î', 'j': 'ĵ', 'o': 'ô', 's': 'ŝ', 'u': 'û', 'w': 'ŵ', 'x': '◯', 'y': 'ŷ'},
            'o': {'A': 'Å', 'U': 'Ů', 'a': 'å', 'u': 'ů'},
            '/': {'O': 'Ø', 'h': 'ℏ', 'o': 'ø'},
            ',': {'C': 'Ç', 'G': 'Ģ', 'K': 'Ķ', 'L': 'Ļ', 'N': 'Ņ', 'R': 'Ŗ', 'S': 'Ş', 'T': 'Ţ', 'c': 'ç', 'k': 'ķ', 'l': 'ļ', 'n': 'ņ', 'r': 'ŗ', 's': 'ş', 't': 'ţ'},
            '-': {'A': 'Ā', 'E': 'Ē', 'I': 'Ī', 'O': 'Ō', 'U': 'Ū', 'a': 'ā', 'e': 'ē', 'i': 'ī', 'o': 'ō', 'u': 'ū'},
            'u': {'A': 'Ă', 'G': 'Ğ', 'U': 'Ŭ', 'a': 'ă', 'g': 'ğ', 'u': 'ŭ'},
            '.': {'C': 'Ċ', 'E': 'Ė', 'G': 'Ġ', 'I': 'İ', 'Z': 'Ż', 'c': 'ċ', 'e': 'ė', 'g': 'ġ', 'o': '⊙', 's': '⋅', 't': '⃛', 'z': 'ż'},
            '?': {'A': 'Ą', 'E': 'Ę', 'I': 'Į', 'U': 'Ų', 'a': 'ą', 'e': 'ę', 'i': 'į', 'u': 'ų'},
            'v': {'C': 'Č', 'D': 'Ď', 'E': 'Ě', 'L': 'Ľ', 'N': 'Ň', 'R': 'Ř', 'S': 'Š', 'T': 'Ť', 'Z': 'Ž', 'c': 'č', 'd': 'ď', 'e': 'ě', 'l': 'ľ', 'n': 'ň', 'r': 'ř', 's': 'š', 't': 'ť', 'z': 'ž'},
            '_': {'D': 'Đ', 'H': 'Ħ', 'L': 'Ł', 'T': 'Ŧ', 'd': 'đ', 'h': 'ħ', 'l': 'ł', 't': 'ŧ'}
        }

        export function inlineMarkup(customTokens: Map<string,string> | {get(name:string): string} = new Map()) {
            const args: FormatArgs = new Map();       

            args.set('escaped', {pattern: /\\(?<what>[^ntp])/g, reviver({groups}) {
                return groups.what
            }});
            args.set('raw', {pattern: /&lt;&lt;\/(?<text>[\s\S]*?)\/&gt;&gt;/g, reviver({groups}) {
                return groups.text
            }});
            args.set('src_comment', {pattern: /&lt;!!--(?<text>[\s\S]*?)--&gt;/g, reviver() {return ''}});
            args.set('comment', {pattern: /&lt;!--(?<text>[\s\S]*?)--&gt;/g, isInline: true, reviver({groups}) {
                return `<!--${groups.text}-->`
            }});
            args.set('code', {pattern: /(`)(?<text>.*?)\1/g, reviver({groups}) {
                return `<code>${groups.text}</code>`
            }});
            args.set('symbol', {pattern: /\/(?<what>(&#x27;|&quot;|.).|\?|!)\//g, reviver({groups}) {
                switch(groups.what) {
                    case '!': return '&iexcl;';
                    case '?': return '&iquest;';
                    default: return Configuration.SYMBOLS[groups.what.substring(0,groups.what.length-1)]?.[groups.what.substring(groups.what.length-1)] ?? `/${groups.what}/`;
                }
            }});

            args.set('unicode_shortcut', {pattern: /(?<=\b)(?:TM|SS|PG|SM)(?=\b)|\([cCrR]\)|-&gt;|&lt;-/g, reviver({text}) {
                switch(text) {
                    case 'SS': return '&sect;';
                    case 'PG': return '&para;';
                    case 'SM': return '&#8480;';
                    case 'TM': return '&trade;';
                    case '(C)':
                    case '(c)': return '&copy';
                    case '(R)':
                    case '(r)': return '&reg;';
                    case '-&gt;': return '&rarr;';
                    case '&lt;-': return '&larr;';
                    default: return text;
                }
            }})

            args.set('strong', {pattern: /(\*\*)(?=[^*])(?<TEXT>.*?)\1/g});
            args.set('em', {pattern: /(\*)(?=[^*])(?<TEXT>.*?)\1/g});

            function SimpleInlineRegExp(marker: string) {
                return new RegExp(String.raw`(${marker.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})(?<TEXT>.*?)\1`, 'g')
            }

            args.set('u', {pattern: SimpleInlineRegExp('__')});
            args.set('del', {pattern: SimpleInlineRegExp('~~')});
            args.set('sup', {pattern: SimpleInlineRegExp('^^')});
            args.set('sub', {pattern: SimpleInlineRegExp(',,')});

            args.set('mark', {pattern: /(\|\|)(\[(?:color=)?(?<color>[^;]*?)\])?(?<TEXT>.*?)\1/g, reviver({groups}) {
                return `<mark${groups.color ? ` style="background-color:${groups.color}"`: ''}>${groups.TEXT}</mark>`
            }});

            args.set('span', {pattern: /(&amp;&amp;)(\[(?:color=)?(?<color>[^;]*?)\])?(?<TEXT>.*?)\1/g, reviver({groups}) {
                return  `<span style="color:${groups.color ?? 'red'}">${groups.TEXT}</span>`
            }});

            args.set('spoiler', {pattern: /&lt;\?(?<TEXT>.*?)\?&gt;/g, reviver({groups}) {
                return `<span style="filter: blur(0.25em); cursor: pointer;" title="Show spoiler?" onclick="this.removeAttribute('style'); this.removeAttribute('title'); this.removeAttribute('onclick');">${groups.TEXT}</span>`
            }});

            args.set('custom_token', {pattern: /:(?<what>[a-zA-Z0-9][a-zA-Z0-9_\-]*?):/g, isInline: true, reviver({groups}) {return customTokens.get(groups.what) ?? `:${groups.what}:`}});

            args.set('nbsp', {pattern: /\\p/g, reviver() {return '&nbsp;'}});
            args.set('emsp', {pattern: /\\t/g, reviver() {return '&emsp;'}});
            args.set('linebreak', {pattern: /\\n/g, reviver() {return '<br>'}});
            args.set('wordbreak', {pattern: /(?<=\S)-\/-(?=\S)/g, reviver() {return '<wbr>'}});
            
            args.set('a', {pattern: /(?<newtab>\+)?\[(?<href>.*?)\]\((?<TEXT>.*?)\)/g, isInline: true, reviver({blockType, text, groups}) {
                return `<a href="${/^[^:]*?(?:(?:(?<=mailto|tel|https|http):|\/.*:).*)?$/g.test(groups.href) ? groups.href : 'about:blank#blocked'}"${groups.newtab ? ' target="_blank"':''}>${groups.TEXT}</a>`
            }});

            args.set('autolink', {pattern: /(?<text>(?:(?<protocol>https?:\/\/)|(?<www>www\.))(?<link>\w[\w\-]*(?<=\w)\.\w[\w.\/?&#%=+\-]*(?<=[\w\/])))/g, reviver({groups}) {
                return `<a href="${groups.protocol ?? 'https://'}${groups.www ?? ''}${groups.link}">${groups.text}</a>`
            }});

            args.set('autolink_email', {pattern: /(?<text>\w[\w.\-]*?@[\w.\-]+\.\w+)/g, reviver({groups}) {
                return `<a href="mailto:${groups.text}">${groups.text}</a>`
            }});

            args.set('html', {pattern: /&lt;(?<what>\/?(?:code|em|i|strong|b|u|del|sub|sup|mark|span|wbr|br))&gt;/g, isInline: true, reviver({blockType, text, groups}) {
                return `<${groups.what}>`
            }});
            return args
        }

        export function blockMarkup(customTokens: Map<string,string> | {get(name:string): string} = new Map(), properties: Map<string,string> = new Map(), ids: Set<string> = new Set()) {
            const args: FormatArgs = new Map(), inlineArgs: FormatArgs = inlineMarkup(customTokens);

            args.set('escaped', inlineArgs.get('escaped')!)
            args.set('raw', inlineArgs.get('raw')!)
            args.set('src_comment', inlineArgs.get('src_comment')!)
            args.set('comment', inlineArgs.get('comment')!)

            args.set('code_block', {pattern: /(```)(?<language>[a-z]+)?(?<text>[\s\S]*?)\1/g, isInline: false, reviver({groups}, decode) {
                return `<pre><code>${groups.language ? SHML.parseCode(decode(groups.text).replace(/&lt;|&gt;|&amp;|&quot;|&#x27;/g, (match: string) => {
                    switch(match) {
                        case '&lt;': return '<';
                        case '&gt;': return '>';
                        case '&amp;': return '&';
                        case '&quot;': return '"';
                        case '&#x27;': return '\'';
                        
                        default: throw null;
                    }
                }).trim(), groups.language, false) : groups.text.trim()}</code></pre>`;
            }});

            args.set('property', {pattern: /^\s*?!\s*?(?<key>[a-zA-Z_][a-zA-Z_0-9]*?)(?<!http|https):(?<value>.*?)$/gm, isInline: false, reviver({groups}) {
                properties.set(groups.key, groups.value.trim())
                return ''
            }});
            args.set('template', {pattern: /\${(?<key>[a-zA-Z_][a-zA-Z_0-9]*?)\}/g, isInline: true, reviver({groups}) {
                return properties.get(groups.key) ?? `\${${groups.key}}`
            }});

            args.set('image', {pattern: /!\[(?<src>\S*?)(?:\s*?(?<height>auto|\d*)(?:[xX](?<width>auto|\d*))?)?\](?:\((?<alt>.*?)\))?/g, reviver({groups}) {
                groups.width ??= groups.height
                return `<img src="${groups.src}"${groups.alt ? ` alt="${groups.alt}"`: ''}${groups.height ? ` height="${groups.height}"` : ''}${groups.width ? ` width="${groups.width}"` : ''}>`
            }})

            for(const entry of inlineArgs.entries())
                if(!args.has(entry[0]))
                    args.set(...entry)

            args.set('details', {pattern: /(?<=\n|^)\s*!(?<mode>[vV]|&gt;)?!(?<summary>.*?)\[\s*(?<DETAILS>[\s\S]*?)\s*(?<!\])\](?!\])/g, isInline: false, reviver({groups}) {
                return `<details${groups.mode?.toLowerCase?.() === 'v' ? ' open' : ''}><summary>${groups.summary}</summary>\n${groups.DETAILS}</details>`
            }});

            args.set('text-align', {pattern: /(?<=\n|^)[^\S\n]*?@@\s*?(?<what>center(?:ed)?|left|right|justif(?:y|ied)(?:-all)?)\s*?(?<TEXT>[\s\S]*?)(?:$|(?:(?<=\n)[^\S\n]*?@@\s*?reset)|(?=\n[^\S\n]*?@@\s*?(?:center(?:ed)?|left|right|justif(?:y|ied)(?:-all)?)))/g, isInline: false, reviver({groups}) {
                const overrides: {[match: string]: string} = { centered: 'center', justified: 'justify', 'justified-all': 'justify-all' }
                return `<div style="text-align: ${overrides[groups.what] ?? groups.what};">${groups.TEXT}</div>`
            }})

            args.set('numbered_header', {pattern: /^\s*?(?<count>#{1,6})(?:\[(?<id>[a-zA-Z_][a-zA-Z_0-9]*?)\])?\s?(?<TEXT>[^\uffff]*?)\k<count>?(?=\n|$)/gm, isInline: false, reviver({groups}) {
                if(groups.id) ids.add(`h${groups.count.length}:${groups.id}`)
                groups.id ??= cyrb64(groups.TEXT)
                return `<h${groups.count.length} id="h${groups.count.length}:${groups.id}"><a href="#h${groups.count.length}:${groups.id}" title="Link to section">${groups.TEXT}</a></h${groups.count.length}>`
            }});

            args.set('hr', {pattern: /^\s*([-=])\1{2,}\s*$/gm, isInline: false, reviver() {return '<hr>'}});
            
            args.set('table', {pattern: /\[\[(?:\n\s*(?:title=)?(?<title>[^,\n]*)\n)?(?<contents>[\s\S]*?)\]\]/g, isInline: false, reviver({groups}) {
                const rows = groups.contents.trim().split('\n').map((row: string, index:number) => `\n<tr>${row.split(',').map((column: string) => `<t${index && 'd' || 'h'}>${column.trim()}</t${index && 'd' || 'h'}>`).join('')}</tr>`)
                return `<table>${groups.title ? `\n<caption>${groups.title.trim()}</caption>`: ''}\n<thead>${rows.shift()}\n<thead>\n<tbody>${rows.join('')}\n<tbody>\n</table>`
            }})

            args.set('list', {pattern: /(?<text>(?<=\n|^)[^\n\S]*?(?:\+|\d+[.)])[\s\S]*?(?=\n\n|$))/g, isInline: false, reviver({groups}) {
                type ListType = 'ol' | 'ul'

                const openTags: ListType[] = [];

                let lastType: ListType | null = null, lastIndent = 0, result = '';

                function openTag(tag: ListType) {
                    result += `<${tag}>`
                    openTags.push(tag);
                }
                function closeTag() {
                    result += `</${openTags.pop()}>`;
                }

                for(const line of groups.text.trim().split('\n')) {
                    const groups = line.match(/(?<whitespace>\s*?)(?<what>\+|\d+[.)])(?:\s*)(?<text>.*)/)?.groups;
                    
                    if(!groups) {
                        result = result.replace(/(<\/..\>)$/, '<br>'+line.trim()+'$1');
                        continue;
                    }

                    const currentType: ListType = groups.what === '+' ? 'ul' : 'ol';

                    if(lastType == null || groups.whitespace.length > lastIndent) openTag(currentType);
                    else if (groups.whitespace.length < lastIndent) closeTag();
                    else if(currentType !== lastType) {
                        closeTag();
                        openTag(currentType);
                    }
                    result += `<li>${groups.text}</li>`;
                    [lastType, lastIndent] = [currentType, groups.whitespace.length];
                }
                while(openTags.length) closeTag();

                return result;
            }});

            args.set('blockquote', {pattern: /(?<text>(?:(?:&gt;){3}[\s\S]*?(?:-\s*?(?<citation>.*?))?(?:\n|$))+)/g, isInline: false, reviver({groups}) {
                return `<figure><blockquote>${groups.text.replace(/(?:&gt;){3}/g, '').replace(new RegExp(String.raw`-\s*?${groups.citation?.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\s*?$`),'')}</blockquote>${groups.citation && `<figcaption><cite>- ${groups.citation}</cite></figcaption>` || ''}</figure>`
            }});

            args.set('block_html', {pattern: /&lt;(?<what>\/?(?:h[123456]|hr|blockquote|ul|ol|li))&gt;/g, isInline: false, reviver({groups}) {
                return `<${groups.what}>`
            }});

            args.set('text', {pattern: /(?<=\n)\n?(?<TEXT>[^\uffff]+?)(?=  \s*?\n|\n\n|\uffff|$)/g, isInline: false, reviver({blockType, text, groups}) {
                return groups.TEXT.trim() ? `<p>${groups.TEXT.trim()}</p>\n` : ''
            }});

            return args
        }

        export namespace Code {
            export const SUPPORTED_LANGUAGES = ['html', 'css', 'javascript', 'typescript', 'xml', 'json', 'python', 'diff', 'java', 'none'] as const;

            function appendTokenMatcher(name: string, pattern: RegExp, args: FormatArgs): void {
                args.set(name, {pattern, reviver({groups}) {
                    return `<span data-code-token="${name}">${groups.text}</span>`;
                }});
            }

            export function htmlHighlighter(): FormatArgs {
                const args: FormatArgs = new Map(), matchToken = (name: string, pattern: RegExp) => appendTokenMatcher(name, pattern, args);

                function desanitize(text: string) {
                    return text.replace(/&lt;|&gt;|&amp;|&quot;|&#x27;/g, (match: string) => {
                        switch(match) {
                            case '&lt;': return '<';
                            case '&gt;': return '>';
                            case '&amp;': return '&';
                            case '&quot;': return '"';
                            case '&#x27;': return '\'';
                            
                            default: throw null;
                        }
                    });
                }

                args.set('comment', {pattern: /(?<text>(?:&lt;!--[\s\S]*?--&gt;))/g, reviver({groups}, decode) {
                    return `<span data-code-token="comment">${decode(groups.text).replace(/<span data-code-token="string">|<\/span>/g, '')}</span>`;
                }});
                args.set('doctype', {pattern: /^(?<whitespace>\s*)(?<text>&lt;!DOCTYPE\b.*?&gt;)/i, reviver({groups}) {
                    return `${groups.whitespace || ''}<span data-code-token="doctype">${groups.text}</span>`
                }});

                args.set('style', {pattern: /(?<OPENTAG>&lt;style\b.*?&gt;)(?<content>[\s\S]*?)(?<CLOSETAG>&lt;\/style&gt;)/g, reviver({groups}, decode) {
                    return groups.OPENTAG + parseCode(desanitize(decode(groups.content)), 'css', false) + groups.CLOSETAG;
                }});

                args.set('script', {pattern: /(?<OPENTAG>&lt;script\b.*?&gt;)(?<content>[\s\S]*?)(?<CLOSETAG>&lt;\/script&gt;)/g, reviver({groups}, decode) {
                    return groups.OPENTAG + parseCode(desanitize(decode(groups.content)), 'javascript', false) + groups.CLOSETAG;
                }});

                args.set('tag-open', {pattern: /(?<name>&lt;[a-z\-0-9]+)(?<DATA>[^\uffff\ufffe]*?)(?<close>&gt;)/gi, reviver({groups}) {
                    return `<span data-code-token="tag">${groups.name}</span>${groups.DATA ?? ''}<span data-code-token="tag">${groups.close}</span>`
                }});

                args.set('string',{pattern: /(?<front>=\s*?)(?<text>(?<what>&quot;|&#x27;)(?:.*?[^\\\n])?(?:\\\\)*\k<what>)/g, reviver({groups}) {
                    return groups.front + `<span data-code-token="string">${groups.text}</span>`;
                }});
                
                args.set('tag-close', {pattern: /(?<text>&lt;\/[a-z\-\s0-9]+&gt;)/gi, reviver({groups}) {
                    return `<span data-code-token="tag">${groups.text}</span>`;
                }});

                return args;
            }

            const CSS_AT_RULES = ['charset','color-profile ','counter-style','document ','font-face','font-feature-values','import','keyframes','media','namespace','page','property ','supports','viewport','color-profile','document','layer','property','scroll-timeline','swash','ornaments','annotation','stylistic','styleset','character-variant']
            export function cssHighlighter(): FormatArgs {
                const args: FormatArgs = new Map(), matchToken = (name: string, pattern: RegExp) => appendTokenMatcher(name, pattern, args);

                matchToken('string',/(?<text>(?<what>&quot;|&#x27;)(?:.*?[^\\\n])?(?:\\\\)*\k<what>)/g);
        
                args.set('comment', {pattern: /(?<text>(?:\/\*[\s\S]*?\*\/))/g, reviver({groups}, decode) {
                    return `<span data-code-token="comment">${decode(groups.text).replace(/<span data-code-token="string">|<\/span>/g, '')}</span>`;
                }});
                
                matchToken('keyword', new RegExp(String.raw`(?<text>@(?:${CSS_AT_RULES.join('|')})\b)`, 'g'));

                matchToken('selector', /(?<text>[^\s{};\uffff\ufffe][^{};\uffff\ufffe]*?[^\s{};\uffff\ufffe]?(?=\s*{))/g);
                matchToken('property', /(?<text>\b[a-z\-]+:)/g);

                matchToken('number', /(?<text>\b(\d[\d_]*\.?[\d_]*((?<=[\d.])e[+\-]?\d[\d_]*)?n?(?<!_))(?:%|\b|[a-z]+))/gi);
                matchToken('hexadecimal', /(?<text>#(?:(?:[0-9a-f]){8}|(?:[0-9a-f]){6}|(?:[0-9a-f]){3,4})\b)/gi);

                matchToken('function', /(?<text>\b[a-z\-]+\b(?=\())/g);
                matchToken('other', /(?<text>\b[a-z\-]+\b)/g);

                return args;
            }

            const JAVASCRIPT_KEYWORDS = ['break','case','catch','class','const','continue','debugger','default','delete','do','else','export','extends','finally','for','function','if','import','in','instanceof','new','return','super','switch','this','throw','try','typeof','var','void','while','with','yield','implements','interface','let','package','private','protected','public','static','yield','await','null','true','false','abstract','boolean','byte','char','double','final','float','goto','int','long','native','short','synchronized','throws','transient','volatile','of','eval'];
            export function javascriptHighlighter(): FormatArgs {
                return ecmascriptHighlighter(JAVASCRIPT_KEYWORDS);
            }


            const TYPESCRIPT_KEYWORDS = ['enum','as','asserts','any','async','constructor','declare','get','infer','intrinsic','is','keyof','module','namespace','never','readonly','require','number','object','set','string','symbol','type','undefined','unique','unknown','from','global','bigint','override'];
            export function typescriptHighlighter(): FormatArgs {
                return ecmascriptHighlighter([...JAVASCRIPT_KEYWORDS, ...TYPESCRIPT_KEYWORDS])
            }

            export function ecmascriptHighlighter(keywords: string[]): FormatArgs {
                const args: FormatArgs = new Map(), matchToken = (name: string, pattern: RegExp) => appendTokenMatcher(name, pattern, args);

                args.set('multiline-string', {pattern: /(?<text>(?<what>`)(?:[^\uffff\ufffe]*?[^\\])?(?:\\\\)*\k<what>)/g, reviver: ({groups}) => `<span data-code-token="string">${groups.text}</span>`});
                matchToken('string',/(?<text>(?<what>&quot;|&#x27;)(?:.*?[^\\\n])?(?:\\\\)*\k<what>)/g);
                
                args.set('comment', {pattern: /(?<text>(?:\/\/.*)|(?:\/\*[\s\S]*?\*\/))/g, reviver({groups}, decode) {
                    return `<span data-code-token="comment">${decode(groups.text).replace(/<span data-code-token="string">|<\/span>/g, '')}</span>`;
                }});
                
                matchToken('number', /(?<text>\b(?:Infinity|NaN|0(?:[xX][0-9a-fA-F][0-9a-fA-F_]*|[bB][01][01_]*|[oO][0-7][0-7_]*)(?<!_)|\d[\d_]*\.?[\d_]*((?<=[\d.])[eE][+\-]?\d[\d_]*)?n?(?<!_))\b)/g);
                matchToken('keyword', new RegExp(String.raw`(?<text>\b(?:${keywords.join('|')})\b)`, 'g'));

                return args;
            }

            export function xmlHighlighter(): FormatArgs {
                const args: FormatArgs = new Map();

                const htmlArgs = htmlHighlighter(), inheritFromHTML = (name: string) => args.set(name, htmlArgs.get(name)!);

                inheritFromHTML('comment');
                
                args.set('processing-instruction', {pattern: /(?<name>&lt;\?[a-z0-9\-]+)(?<DATA>\b.*?)(?<close>\?&gt;)/gi, reviver({groups}) {
                    return `<span data-code-token="processing-instruction">${groups.name}</span>${groups.DATA}<span data-code-token="processing-instruction">${groups.close}</span>`
                }})
                
                args.set('cdata', {pattern: /(?<open>&lt;!\[CDATA\[)(?<content>[\s\S]*?)(?<close>\]\]&gt;)/g, reviver({groups}) {
                    return `<span data-code-token="cdata">${groups.open}</span><span data-code-token="cdata-content">${groups.content}</span><span data-code-token="cdata">${groups.close}</span>`
                }});

                inheritFromHTML('tag-open');
                inheritFromHTML('string');
                inheritFromHTML('tag-close');

                return args;
            }

            export function jsonHighlighter(): FormatArgs {
                const args: FormatArgs = new Map(), matchToken = (name: string, pattern: RegExp) => appendTokenMatcher(name, pattern, args);

                matchToken('string',/(?<text>(?<what>&quot;|&#x27;)(?:.*?[^\\\n])?(?:\\\\)*\k<what>)/g);
                matchToken('number', /(?<text>-?\b\d+(\.\d+)?(e[+\-]?\d+)?\b)/gi);
                matchToken('keyword', /(?<text>\b(?:true|false|null)\b)/g);

                return args;
            }

            const PYTHON_KEYWORDS = ['and','as','assert','break','class','continue','def','del','elif','else','except','finally','for','from','global','if','import','in','is','lambda','nonlocal','not','or','pass','raise','return','try','while','with','yield'];
            export function pythonHighlighter(): FormatArgs {
                const args: FormatArgs = new Map(), matchToken = (name: string, pattern: RegExp) => appendTokenMatcher(name, pattern, args);

                args.set('multiline-string', {pattern: /(?<text>(?<what>(?<qtype>&quot;|&#x27;)\k<qtype>{2})(?:[^\uffff\ufffe]*?[^\\])?(?:\\\\)*\k<what>)/g, reviver: ({groups}) => `<span data-code-token="string">${groups.text}</span>`});
                matchToken('string',/(?<text>(?<what>&quot;|&#x27;)(?:.*?[^\\\n])?(?:\\\\)*\k<what>)/g);

                args.set('comment', {pattern: /(?<text>(?:#.*))/g, reviver({groups}, decode) {
                    return `<span data-code-token="comment">${decode(groups.text).replace(/<span data-code-token="string">|<\/span>/g, '')}</span>`;
                }});
                
                matchToken('number', /(?<text>\b(?:0(?:[xX][0-9a-fA-F][0-9a-fA-F_]*|[bB][01][01_]*|[oO][0-7][0-7_]*)(?<!_)|\d[\d_]*\.?[\d_]*((?<=[\d.])[eE][+\-]?\d[\d_]*)?j?(?<!_))\b)/g);
                
                matchToken('value', /(?<text>\b(?:True|False|None)\b)/g);
                matchToken('keyword', new RegExp(String.raw`(?<text>\b(?:${PYTHON_KEYWORDS.join('|')})\b)`, 'g'));

                return args;
            }

            export function diffHighlighter(): FormatArgs {
                const args: FormatArgs = new Map();

                args.set('heading', {pattern: /^(?<range>@@ -\d+,\d+ \+\d+,\d+ @@)(?<heading> .*)?$/gm, reviver({groups}) {
                    return `<span data-code-token="range">${groups.range}</span>` + (groups.heading ? `<span data-code-token="heading">${groups.heading}</span>` : '');
                }});
                args.set('insertion', {pattern: /^(?<text>\+.*)$/gm, reviver({groups}) {
                    return `<span data-code-token="insertion"><ins>${groups.text}</ins></span>`;
                }});
                args.set('deletion', {pattern: /^(?<text>-.*)$/gm, reviver({groups}) {
                    return `<span data-code-token="deletion"><del>${groups.text}</del></span>`;
                }});

                return args;
            }

            export function javaHighlighter(): FormatArgs {
                const args: FormatArgs = new Map(), matchToken = (name: string, pattern: RegExp) => appendTokenMatcher(name, pattern, args);

                args.set('multiline-string', {pattern: /(?<text>(?<what>(?<qtype>&quot;){3})(?:[^\uffff\ufffe]*?[^\\])?(?:\\\\)*\k<what>)/g, reviver: ({groups}) => `<span data-code-token="string">${groups.text}</span>`});
                matchToken('string',/(?<text>(?<what>&quot;|&#x27;)(?:.*?[^\\\n])?(?:\\\\)*\k<what>)/g);
                
                args.set('comment', {pattern: /(?<text>(?:\/\/.*)|(?:\/\*[\s\S]*?\*\/))/g, reviver({groups}, decode) {
                    return `<span data-code-token="comment">${decode(groups.text).replace(/<span data-code-token="string">|<\/span>/g, '')}</span>`;
                }});
                
                const keywords = ['abstract','continue','for','new','switch','assert','default','goto','package','synchronized','boolean','do','if','private','this','break','double','implements','protected','throw','byte','else','import','public','throws','case','enum','instanceof','return','transient','catch','extends','int','short','try','char','final','interface','static','void','class','finally','long','strictfp','volatile','const','float','native','super','while','try','false','null','var'];
                matchToken('number', /(?<text>\b(?:0(?:x[0-9a-f][0-9a-f_]*|b[01][01_]*)(?<!_)|\d[\d_]*\.?[\d_]*((?<=[\d.])e[+\-]?\d[\d_]*)?[dfl]?(?<!_))\b)/gi);
                matchToken('keyword', new RegExp(String.raw`(?<text>\b(?:${keywords.join('|')})\b)`, 'g'));

                matchToken('annotation', /(?<text>@[a-zA-Z_$][a-zA-Z_$0-9]*)\b/g);

                return args;
            }
        }
    }

    export function parseInlineMarkup(text: string, customTokens?: Map<string,string> | {get(name:string): string}) {
        return abstractParse(text, Configuration.inlineMarkup(customTokens))
    }

    export function parseMarkup(text: string, customTokens?: Map<string,string> | {get(name:string): string}, properties?: Map<string,string>): String & {properties: Map<string,string>, ids: Set<string>} {
        const props: Map<string,string> = new Map((properties?.entries() ?? [])), ids: Set<string> = new Set()
        const result = new String(abstractParse(text, Configuration.blockMarkup(customTokens, props, ids)))
        Object.defineProperty(result, 'properties', {value: props})
        Object.defineProperty(result, 'ids', {value: ids})
        return result as String & {properties: Map<string,string>, ids: Set<string>}
    }

    export function parseCode(text: string, language: typeof Configuration.Code.SUPPORTED_LANGUAGES[number] = 'none', markLines: boolean = true, lineOffset: number = 1): string {
        if(language !== 'none') {
            const args: FormatArgs = (function() {
                switch(language) {
                    case 'html': return Configuration.Code.htmlHighlighter();
                    case 'css': return Configuration.Code.cssHighlighter();
                    case 'javascript': return Configuration.Code.javascriptHighlighter();
                    case 'typescript': return Configuration.Code.typescriptHighlighter();
                    case 'xml': return Configuration.Code.xmlHighlighter();
                    case 'json': return Configuration.Code.jsonHighlighter();
                    case 'python': return Configuration.Code.pythonHighlighter();
                    case 'diff': return Configuration.Code.diffHighlighter();
                    case 'java': return Configuration.Code.javaHighlighter();
                    default: return new Map();
                }
            })();

            text = abstractParse(text, args);
        }

        if(markLines)
            text = text.split('\n').map((line: string, i: number)=>`<span data-code-token="line-number">${(i+lineOffset).toString().padStart((text.split('\n').length+lineOffset).toString().length,' ')}</span><span data-code-token="line" data-code-line="${i+lineOffset}">${line}</span>`).join('\n');

        return `<span data-code-language="${language}">${text}</span>`;
    }
}
