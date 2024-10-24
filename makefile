
clean:
	@rm -fr .next node_modules .mypy_cache .ruff_cache
	@find ./api | grep -E "(/__pycache__$|\.pyc$|\.pyo$)" | xargs rm -fr @

