PHONY: github pudding docs docs-eval docs-data docs-clone docs-clean

github:
	rm -rf docs
	cp -r build docs
	touch docs/.nojekyll
	git add -A
	git commit -m "update github pages"
	git push

# ── Vendored docs (formulacode.org/docs/{eval,data}) ─────────────────────────
# Cloned repos live in _repos/ (gitignored) and the built site is mirrored
# into static/docs/{eval,data} (committed) so SvelteKit's static adapter
# publishes them under formulacode.org. Run `make docs` after pulling in
# upstream changes from the vendored repos.

REPOS_DIR := _repos
VENV_DOCS := .venv-docs
MKDOCS    := $(VENV_DOCS)/bin/mkdocs

$(VENV_DOCS):
	uv venv $(VENV_DOCS) --python 3.12
	uv pip install --python $(VENV_DOCS)/bin/python \
	    mkdocs mkdocs-material 'mkdocstrings[python]' pymdown-extensions

docs-clone:
	@mkdir -p $(REPOS_DIR)
	@if [ ! -d $(REPOS_DIR)/fc-eval ]; then \
	    git clone --depth=1 https://github.com/formula-code/fc-eval.git $(REPOS_DIR)/fc-eval ; \
	else \
	    git -C $(REPOS_DIR)/fc-eval pull --ff-only ; \
	fi
	@if [ ! -d $(REPOS_DIR)/datasmith ]; then \
	    git clone --depth=1 https://github.com/formula-code/datasmith.git $(REPOS_DIR)/datasmith ; \
	else \
	    git -C $(REPOS_DIR)/datasmith pull --ff-only ; \
	fi

docs-eval: $(VENV_DOCS) docs-clone
	cd $(REPOS_DIR)/fc-eval && $(CURDIR)/$(MKDOCS) build --site-dir _site
	rm -rf static/docs/eval
	mkdir -p static/docs/eval
	cp -R $(REPOS_DIR)/fc-eval/_site/. static/docs/eval/

docs-data: $(VENV_DOCS) docs-clone
	cd $(REPOS_DIR)/datasmith && $(CURDIR)/$(MKDOCS) build --site-dir _site
	rm -rf static/docs/data
	mkdir -p static/docs/data
	cp -R $(REPOS_DIR)/datasmith/_site/. static/docs/data/

docs: docs-eval docs-data
	@echo "Built static/docs/{eval,data}. npm run build will pick them up."

docs-clean:
	rm -rf $(REPOS_DIR) $(VENV_DOCS) static/docs
