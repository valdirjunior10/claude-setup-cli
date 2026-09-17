name: Auto Tag Release

on:
  push:
    branches: [{{RELEASE_BRANCH}}]

jobs:
  tag:
    if: startsWith(github.event.head_commit.message, 'chore(release):')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Extrair versão do commit
        id: version
        run: |
          VERSION=$(echo "${{ github.event.head_commit.message }}" | grep -oP 'v\K[0-9]+\.[0-9]+\.[0-9]+')
          echo "version=$VERSION" >> "$GITHUB_OUTPUT"

      - name: Criar e enviar a tag
        env:
          # ATENÇÃO: GITHUB_TOKEN não dispara outros workflows (ex: um
          # segundo Action escutando "on: push tags" pra deploy). Se
          # precisar encadear algo a partir da tag, troque por um
          # Personal Access Token (secret RELEASE_PAT).
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          git tag "v${{ steps.version.outputs.version }}"
          git push origin "v${{ steps.version.outputs.version }}"
