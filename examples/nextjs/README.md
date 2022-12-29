## Getting Started

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn/foundations/about-nextjs) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Run Cypress Cloud

In order to run Cypress Cloud you can use the following command:

> Make sure that .env file created and you have `CURRENTS_RECORD_KEY` env variable set up

```
yarn cypress
```

## Run Cypress Cloud Script

For testing, we run cypress Cloud as a package. Before following the instructions here, open a separate terminal and run `cypress-cloud` package in DEV mode. Please, follow the README from the package to set up the project locally.

Before running cypress tests, make sure you have configured all environments properly and they use your locally set up Currents dashboard.

To run tests by using the script from this example, run the command below:

```
yarn cypress:script
```

> You can use `DEBUG` environment variable to see more info about execution, as an example `DEBUG=currents:cypress yarn cypress:script`.

### Simulate currents runner execution from CI

- Github Actions

```
bash ./test/run-from-github-actions.sh
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_source=github.com&utm_medium=referral&utm_campaign=turborepo-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
