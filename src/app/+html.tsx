import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Paints the page in the theme's background before the stylesheet applies, and tells the browser
// both schemes are supported (scrollbars, form controls). Plain CSS only: the CSP allows inline
// styles but just the one inline script Expo Router adds. Keep in sync with `--color-background`
// and `--color-foreground` in global.css.
const pageStyle = `
html, body { background-color: #F3F6F8; color: #0E2230; }
@media (prefers-color-scheme: dark) {
  html, body { background-color: #0E2230; color: #E6EEF2; }
}
`;

// Web only: renders in Node during the static export, never in the browser.
export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FFFFFF" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#132D3F" />
        <ScrollViewStyleReset />
        <style id="theme-background" dangerouslySetInnerHTML={{ __html: pageStyle }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
