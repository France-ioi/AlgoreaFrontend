import { Pipe, PipeTransform } from '@angular/core';

function replaceHTML(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

@Pipe({
  name: 'allowDisplayCodeSnippet', pure: true,
  standalone: true
})
export class AllowDisplayCodeSnippet implements PipeTransform {

  transform(text: string, theme: 'dark' | 'light' = 'light'): string {
    const regExp = /(`{3}(.+?)`{3})|(`(.+?)`)/gs;
    return replaceHTML(text).replace(regExp, (substring: string, ...args: string[]): string => {
      const [ , matchedWithTripleQuotes, , matchedWithSingleQuotes ] = args;
      return matchedWithTripleQuotes ? `
        <pre class="alg-code-wrapper"><code class="alg-code ${ theme }">${ matchedWithTripleQuotes }</code></pre>
      ` : matchedWithSingleQuotes ? `<code class="alg-code with-bg ${ theme }">${ matchedWithSingleQuotes }</code>` : '';
    }).replace(/(\r\n|\n|\r)/gm, '<br>');
  }
}
