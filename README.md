# curse-notice

A small app for making Castlevania 2 message images.

(Not yet working.)

## Development

Install the dependencies...

```bash
cd curse-notice
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

## Embedding the font in the svg

If the font isn't embedded in the svg, it won't appear in the generated png. So, to embed it:

- Run `base64 -w 0 src/PixelEmulator-xq08.ttf > src/pixel-emulator-ttf.base64`
- Paste the contents of `src/pixel-emulator-ttf.base64` into the src attribute of the `@font-face` inside the `<style>` tag in the svg in index.html *after* the `data:application/font-truetype;base64,` part of the line.

## Embedding the images in the svg

If the images aren't embedded in the svg, they won't appear in the generated png. So, to embed them:

- Run `make encode-images`.
- Paste the contents of the images you want in `src/images-b64` into the href attribute of the `<image>` tags inside the svg in index.html.

## Building and running in production mode

To create an optimised version of the app:

```bash
npm run build
```

You can run the newly built app with `npm run start`. This uses [sirv](https://github.com/lukeed/sirv), which is included in your package.json's `dependencies` so that the app will work when you deploy to platforms like [Heroku](https://heroku.com).

## License

BSD.
