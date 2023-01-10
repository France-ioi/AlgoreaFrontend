import { Pipe, PipeTransform } from '@angular/core';

function replaceHTML(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

@Pipe({ name: 'allowDisplayCode', pure: true })
export class AllowDisplayCode implements PipeTransform {

  transform(text: string): string {
    const regExp = /(`{3}(.+?)`{3})|(`(.+?)`)/gs;
    return replaceHTML(text).replace(regExp, (substring: string, ...args: string[]): string => {
      const [ , matchedWithTripleQuotes, , matchedWithSingleQuotes ] = args;
      return matchedWithTripleQuotes ? `<pre class="alg-code-wrapper"><code class="alg-code">${ matchedWithTripleQuotes }</code></pre>`
        : matchedWithSingleQuotes ? `<code class="alg-code with-bg">${ matchedWithSingleQuotes }</code>` : '';
    });
  }
}
