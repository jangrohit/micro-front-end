# Micro Frontend Project

This project demonstrates a micro frontend architecture using **Webpack 5 Module Federation**. The `container` package is the host application. It loads the independently built `marketing` application at runtime. The `auth` and `dashboard` directories exist, but they are not currently connected to the host as micro frontends.

## Architecture

```text
Browser
  |
  +-- container (host, port 8080)
        +-- Header and host-level layout
        +-- marketing (remote, port 8081)
              +-- Landing page (/)
              +-- Pricing page (/pricing)
```

### Container: the host

The container owns the top-level page and header. Its Module Federation configuration declares a remote named `marketing`, served in development from `http://localhost:8081/remoteEntry.js`. The container imports `marketing/MarketingApp` in `src/components/MarketingApp.js`, then calls the remote's exported `mount` function with a DOM element owned by the container.

The host starts at `src/index.js`, which dynamically imports `src/bootstrap.js`. The separate bootstrap entry lets Webpack initialize the shared dependencies before the application code uses React.

### Marketing: the remote

Marketing exposes `./MarketingApp` from `src/bootstrap.js` using Module Federation. That module exports `mount(element)`, which renders the marketing React app into the element supplied by the host. In development, it also mounts itself into `#_marketing-dev-root`, allowing the remote to run on its own at `http://localhost:8081`.

Marketing defines its routes in `src/App.js`: `/` renders the landing page and `/pricing` renders the pricing page. Its `src/index.js` also dynamically imports `src/bootstrap.js`.

### Runtime loading

When a browser opens the container:

1. The container's HTML loads its Webpack entry.
2. The container requests the marketing remote entry from port `8081`.
3. The remote entry describes the exposed modules and how to load them; it is not the entire marketing application by itself.
4. The container imports `MarketingApp`, obtains `mount`, and mounts the remote into its page.
5. Webpack loads any additional chunks the host or remote needs.

This is runtime composition: the container does not compile the marketing source into its own bundle as a normal source import. Module Federation coordinates loading the remote and sharing configured dependencies.

## Packages

| Package              | Current role                                         | Status                                                                                                                    |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `packages/container` | Host shell, header, and marketing remote integration | Implemented; runs on port `8080`                                                                                          |
| `packages/marketing` | Federated remote with landing and pricing routes     | Implemented; runs on port `8081`                                                                                          |
| `packages/auth`      | Reserved for authentication UI                       | Package metadata only; not wired into the host                                                                            |
| `packages/dashboard` | Reserved for dashboard UI                            | Package metadata only; its scripts reference Webpack config files that are not present, and it is not wired into the host |

## Run Locally

Install dependencies in the packages that you will run. Each package has its own `package.json` and lockfile; there is no root-level install script.

```sh
cd packages/marketing
npm install
npm start
```

In a second terminal, start the host:

```sh
cd packages/container
npm install
npm start
```

Open **http://localhost:8080** to see the composed application. The marketing remote must be running because the container fetches it from port `8081`. To work on the remote by itself, open **http://localhost:8081**.

## Build

Build each deployable application from its own package directory:

```sh
cd packages/marketing
npm run build

cd ../container
npm run build
```

Webpack writes build artifacts to each package's `dist/` directory. Production output uses content-hashed JavaScript filenames. The marketing build also emits `remoteEntry.js`, which the host needs to locate and load the remote's exposed module.

## Webpack and Babel

Each application has common, development, and production Webpack configuration files under `config/`:

- `webpack.common.js` applies `babel-loader` to project JavaScript and JSX, and uses `HtmlWebpackPlugin` to generate the HTML page.
- `webpack.dev.js` configures the local dev server and Module Federation URLs.
- `webpack.prod.js` enables production output and sets deployment paths.

The Babel rule uses `@babel/preset-react` for JSX and `@babel/preset-env` for modern JavaScript syntax. The rule transforms source code; Webpack's entry points, imports, and chunking determine the emitted JavaScript files.

Both the host and remote configure `shared` from their package's dependencies. This lets Module Federation coordinate common dependencies such as React at runtime. The configuration shares the dependency list, but does not currently declare explicit singleton or version constraints.

## Production Deployment

The container's production Webpack config uses `PRODUCTION_DOMAIN` to locate the marketing remote at:

```text
${PRODUCTION_DOMAIN}/marketing/latest/remoteEntry.js
```

The marketing output uses `/marketing/latest/` as its public path; the container output uses `/container/latest/`. Deploy the marketing assets, including `remoteEntry.js`, at the configured marketing path, and deploy the container at its configured path. The `latest` directory convention is configured in Webpack; this repository does not include a deployment pipeline that publishes those artifacts.

## Current Integration Note

Both `container/src/App.js` and `marketing/src/App.js` currently render a `BrowserRouter`. Since the host mounts marketing inside its own router, this creates nested routers in the composed application. React Router generally does not support nesting `BrowserRouter` instances. If routing behaves unexpectedly when composed, use one top-level router and make the remote consume the host's routing context, or give the remote an isolated routing strategy.

The container's header currently uses a fixed `signedIn={true}` value and a placeholder sign-out callback. The `auth` package is not yet responsible for authentication.
