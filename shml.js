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
SHML = {
  parseInlineMarkup: function(str) {
    return str
      .replace(/(\*\*\*)(.*?)\1/gs, '<strong><em>$2</em></strong>')
      .replace(/(\*\*)(.*?)\1/gs, '<strong>$2</strong>')
      .replace(/(\*)(.*?)\1/g, '<em>$2</em>')
      .replace(/(__)(.*?)\1/g, '<u>$2</u>')
      .replace(/(~~)(.*?)\1/g, '<del>$2</del>')
      .replace(/(\^)(.*?)\1/g, '<sup>$2</sup>')
      .replace(/(,,)(.*?)\1/g, '<sub>$2</sub>')
      .replace(/(\|)(.*?)\1/g, '<mark>$2</mark>')
      .replace(/(\S)--(\S)/g, '$1<wbr>$2')
      .replace(/(`)(.*?)\1/g, '<code>$2</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" title="$1" target="_blank">$1</a>')
      .replace(/%%/g, '<br>')
    ;
  },
  parseMarkup: function(markdown = '', properties = []) {
    let data = {
      properties: {},
      stack: [],
      toHTML: () => data.stack.join(''),
      getProperty: (property) => data.properties[property]
    };
    let push = object => data.stack.push(object);
    let parseForSection = (tag, str, key = tag) => str.replace(new RegExp('^\\s*?' + key + ':(.*)', 'g'), (str, match) => (push('<' + tag + '>' + SHML.parseInlineMarkup(match.trim()) + '</' + tag + '>'), ''));
    markdown.split(/\n/g).forEach((object, index, array) => {
      if(object.trim().startsWith('<') && object.trim().endsWith('>')) push(object);
      else {
        for(var property of properties)
          if(data.properties[property] === undefined)
            object.replace(new RegExp('^\\s*?!' + property + ':(.*)'), (str, match) => (data.properties[property] = match.trim(), ''));

        for(var i = 1; i < 7; i++) parseForSection('h' + i, object);
        parseForSection('p', object);
        object.replace(/^\s*?(?:bull:|\+)(.*)/g, (str, match) => (push('<ul><li>' + SHML.parseInlineMarkup(match.trim()) + '</li></ul>'), ''));
        object.replace(/\s*---+\s*/, () => (push('<hr>'), ''));
        object.replace(/\s*%%\s*/, () => (push('<br>'), ''));
      }
    });
    return data;
  }
}
