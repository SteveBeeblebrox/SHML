/*
MIT License

Copyright (c) 2020 SteveBeeblebrox

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
class SHML {
  constructor() {return {};}
  
  static #specialCharacters = {
    '~': {'A': 'Ã', 'I': 'Ĩ', 'N': 'Ñ', 'O': 'Õ', 'U': 'Ũ', 'a': 'ã', 'i': 'ĩ', 'n': 'ñ', 'o': 'õ', 'u': 'ũ'},
    ':': {'A': 'Ä', 'E': 'Ë', 'I': 'Ï', 'O': 'Ö', 'U': 'Ü', 'Y': 'Ÿ', 'a': 'ä', 'e': 'ë', 'i': 'ï', 'o': 'ö', 'u': 'ü', 'y': 'ÿ'},
    '\'': {'A': 'Á', 'C': 'Ć', 'E': 'É', 'I': 'Í', 'L': 'Ĺ', 'N': 'Ń', 'O': 'Ó', 'R': 'Ŕ', 'S': 'Ś', 'U': 'Ú', 'Y': 'Ý', 'Z': 'Ź', 'a': 'á', 'c': 'ć', 'e': 'é', 'g': 'ǵ', 'i': 'í', 'l': 'ĺ', 'n': 'ń', 'o': 'ó', 'r': 'ŕ', 's': 'ś', 'u': 'ú', 'y': 'ý', 'z': 'ź'},
    '"': {'O': 'Ő', 'U': 'Ű', 'o': 'ő', 'u': 'ű'},
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
  
  static #cyrb64(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    return (h2>>>0).toString(16).padStart(8,0)+(h1>>>0).toString(16).padStart(8,0);
  }

  static getStyleSheet() {
    return `<style>
      @media (min-width:601px) {
        .shml-internal-half {width: 50%; float: left;}
        .shml-internal-third {width: 33.33333%; float: left;}
        .shml-internal-two-third {width: 66.66666%; float: left;}
        .shml-internal-quarter {width: 25%; float: left;}
        .shml-internal-three-quarter {width: 75%; float: left;}
      }
    </style>`;
  }
  static parseInlineMarkup(markup, customTokens = {}) {
    let characterVariants = {
      '~': 'tilde',
      ':': 'uml',
      '\'': 'acute',
      '"': 'dblac',
      '`': 'grave',
      '^': 'circ',
      'o': 'ring',
      '/': 'slash',
      ',': 'cedil',
      '-': 'macr',
      'u': 'breve',
      '.': 'dot',
      '?': 'ogon',
      'v': 'caron',
      '_': 'stroke'
    }
    let result = {__proto__: null, toHTML: () => result._value, _value: ''}, code = false, escaped = false;
    markup.split(/(`|\$\$)([\S\s]*?)(\1)/g).forEach(object => {
      if(object === '`') code = !code, object = '';
      if(object === '$$') escaped = !escaped, object = '';
      result._value += !code && !escaped ? object
          .replace(new RegExp('\\/([' + Object.keys(characterVariants).join('').replace(/[.*+?^${}()|[\]\\\-]/g, '\\$&') + '])([a-zA-Z])\\/', 'g'), (string, match1, match2) => '&' + match2 + characterVariants[match1] + ';')
          .replace(/\/!\//g, '&iexcl;')
          .replace(/\/\?\//g, '&iquest;')  
          .replace(/(\*\*\*)(.*?)\1/gs, '<strong><em>$2</em></strong>')
          .replace(/(\*\*)(.*?)\1/gs, '<strong>$2</strong>')
          .replace(/(\*)(.*?)\1/gs, '<em>$2</em>')
          .replace(/(__)(.*?)\1/gs, '<u>$2</u>')
          .replace(/(~~)(.*?)\1/gs, '<del>$2</del>')
          .replace(/(\^)(.*?)\1/gs, '<sup>$2</sup>')
          .replace(/(,,)(.*?)\1/gs, '<sub>$2</sub>')
          .replace(/(&&)\[(#[a-fA-F0-9]{6})\](.*?)\1/gs, '<span style="color: $2;">$3</span>')
          .replace(/(\|)\[(#[a-fA-F0-9]{6})\](.*?)\1/gs, '<mark style="background-color: $2;">$3</mark>')
          .replace(/(\|)(.*?)\1/gs, '<mark>$2</mark>')
          .replace(/(:)(\S*?)\1/gs, (string, match1, match2) => customTokens[match2] ?? (':' + match2 + ':'))
          .replace(/(\S)-\/-(\S)/g, '$1<wbr>$2')
          .replace(/\+\[(.*?)\]\((.*?)\)/g, '<a href="$2" title="$1" target="_blank">$1</a>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" title="$1" target="_self">$1</a>')
          .replace(/%%/g, '<br>')
        : object === '' ? '' :  code ? '<code>'+object+'</code>' : object;
    });
    return result;
  }
  static parseMarkup(markup = '', customTokens = {}) {
    let data = {
      __proto__: null,
      _properties: {},
      _value: [],
      _ids: [],
      toHTML: () => data._value.join(''),
      getProperty: (property) => data._properties[Symbol.for(property)],
      getProperties: () => new Proxy({__proto__: null, ...data._properties},
      {
        get: function(target, name, receiver) {
          if (name === Symbol.iterator) return (function*() {
            for(let prop of Object.getOwnPropertySymbols(target).filter(object => object !== Symbol.iterator)) yield [prop, target[prop]]
          }).bind(target);
          else return target[Symbol.for(name)];
        },
        set: function() {
            return false;
        }
      }),
      getIds: () => new Proxy([...data._ids],
      {
        set: function() {
            return false;
        }
      })
    };
    let push = object => data._value.push(object);
    let pushId = object => data._ids.push(object);
    let parseForHeader = (header, str) => str.replace(new RegExp('^\\s*?' + '#'.repeat(header) + '(.*)', 'g'), (str, match) => (push('<h' + header + '>' + SHML.parseInlineMarkup(match.trim(), customTokens).toHTML() + '</h' + header + '>'), ''));
    let parseForIdHeader = (header, str) => str.replace(new RegExp('^\\s*?' + '#'.repeat(header) + '\\[(.*?)\\]\\s*?(.*)', 'g'), (str, match1, match2) => (pushId('h' + header + ':' + match1), push('<a href="#h' + header + ':' + match1 + '"><h' + header + ' id="h' + header + ':' + match1 + '">' + SHML.parseInlineMarkup(match2.trim(), customTokens).toHTML() + '</h' + header + '></a>'), ''));
    let parseForSection = (tag, str) => str.replace(new RegExp('^\\s*?' + tag + ':(.*)', 'g'), (str, match) => (push('<' + tag + '>' + SHML.parseInlineMarkup(match.trim(), customTokens).toHTML() + '</' + tag + '>'), ''));
    let parseForIdSection = (tag, str) => str.replace(new RegExp('^\\s*?' + tag + '\\[(.*?)\\]:(.*)', 'g'), (str, match1, match2) => (pushId(tag + ':' + match1), push('<a href="#' + tag + ':' + match1 + '"><' + tag + ' id="' + tag + ':' + match1 + '">' + SHML.parseInlineMarkup(match2.trim(), customTokens).toHTML() + '</' + tag + '></a>'), ''));
    let escaped = false, table = false, tableHeader = true;
    markup.split(/\n/g).forEach((object, index, array) => {
      if(object.trim() === '$$') return void (escaped = !escaped);
      if(escaped) return void push(object);
      
      if(object.trim() === '[[') return void (table = true, push('<table>'));
      else if(object.trim() === ']]') return void (table = false, tableHeader = true, push('</table>'));
      else if(table) {
        let makeRow = (t) => SHML.parseInlineMarkup(('<tr><t'+t+'>'+object.trim().split(/(?<!\$),/).join('</t'+t+'><t'+t+'>')+'</t'+t+'></tr>').replace(/\$,/g, ','), customTokens).toHTML();
        if(tableHeader) return void (tableHeader = false, push(makeRow('h')));
        else return void push(makeRow('d'));
      }
      
      
      for(let i = 6; i > 0; i--) object = parseForIdHeader(i, object);
      for(let i = 1; i < 7; i++) object = parseForIdSection('h' + i, object);
      
      for(let i = 6; i > 0; i--) object = parseForHeader(i, object);
      for(let i = 1; i < 7; i++) object = parseForSection('h' + i, object);
      object = parseForSection('p', object);
      object = object
      .replace(/^\s*?!!(.*)/g, (str, match) => '')
      .replace(/^\s*?!(.*?):(.*)/g, (str, match1, match2) => (data._properties[Symbol.for(match1)] ??= match2.trim(), ''))
      .replace(/^\s*?(?:>>|blockquote:)(.*)/g, (str, match) => (push('<blockquote>' + SHML.parseInlineMarkup(match.trim(), customTokens).toHTML() + '</blockquote>'), ''))
      .replace(/^\s*?\+?\[.*?\]\(.*?\).*?$/g, str => SHML.parseInlineMarkup(str.trim(), customTokens).toHTML())
      .replace(/^\s*?(?:bull:|\+)(.*)/g, (str, match) => (push('<ul><li>' + SHML.parseInlineMarkup(match.trim(), customTokens).toHTML() + '</li></ul>'), ''))
      .replace(/^\s*?\[(.*)\((.*?) ([0-9]*)[xX]([0-9]*)\)\]/g, (str, match1, match2, match3, match4) => (push('<br><img src="' + match2 + '" alt="' + match1.trim() + '" width="' + (parseInt(match3) === 0 ? 'auto' : match3) + '" height="' + (parseInt(match4) === 0 ? 'auto' : match4) + '"><br>'), ''))
      .replace(/^\s*?\[(.*)\((.*)\)\]/g, (str, match1, match2) => (push('<br><img src="' + match2 + '" alt="' + match1.trim() + '"><br>'), ''))
      .replace(/^\s*?\[(.*?) ([0-9]*)[xX]([0-9]*)\]/g, (str, match1, match2, match3) => (push('<br><img src="' + match1 + '" width="' + (parseInt(match2) === 0 ? 'auto' : match2) + '" height="' + (parseInt(match3) === 0 ? 'auto' : match3) + '"><br>'), ''))
      .replace(/^\s*?\[(.*)\]/g, (str, match) => (push('<br><img src="' + match + '"><br>'), ''))
      .replace(/^\s*?(?:img|image):(.*)/g, (str, match) => (push('<br><img src="' + match.trim() + '"><br>'), ''))
      .replace(/\s*---+\s*/, () => (push('<hr>'), ''))
      .replace(/^\s*%%\s*/, () => (push('<br>'), ''));
      push(SHML.parseInlineMarkup(object.trim(), customTokens).toHTML() + (object.trim()  !== '' ? '<br>' : ''));
    });
    return data;
  }
}
