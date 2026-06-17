# Relative Timestamp Rails Sample

Standalone Rails 8.1 documentation UI showing how to install and use the local `relative-timestamp-element` npm package from a Stimulus controller in an importmap app.

## Setup

```sh
bundle install
npm install
bin/rails tailwindcss:build
bin/rails test
bin/dev
```

## Package Integration

The local npm package is installed with:

```sh
npm install ../relative-timestamp-element
```

Because this app uses importmap, the package ESM build is vendored and pinned:

```ruby
pin "relative-timestamp-element", to: "relative-timestamp-element.js"
```

The Rails-facing adapter lives at:

```text
app/javascript/controllers/relative_timestamp_controller.js
```

The documentation UI is available at `/`.

## Deployment Secrets

`.kamal/secrets` is safe to commit because it references `config/master.key` but does not contain the key itself. Never commit `config/master.key`, `.env*`, or credential key files.

For hosted deploys, provide the Rails master key through the platform's encrypted environment variables, for example `RAILS_MASTER_KEY` on Render/Fly/Koyeb.

## Git Hygiene

Track source, lockfiles, vendored importmap JavaScript, fonts, and static public assets. Do not track generated or local-only files such as:

```text
node_modules/
public/assets/
log/*
tmp/*
config/master.key
.env*
```
