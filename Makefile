#
# Makefile for In_that_book_mercari, a chrome extension
#

JS=./js/
ICONS=./icons/
RELEASE=./release/

MANIFEST=manifest.json

_JS_SRCS=                  \
	 contentscript.js  \
	 background.js
JS_SRCS=$(addprefix $(JS), $(_JS_SRCS))

_SOURCE_ICON=source.png
SOURCE_ICON=$(addprefix $(ICONS), $(_SOURCE_ICON))

SIZE=    \
     16  \
     19  \
     48  \
     128

_ICONS_SRCS=            \
            icon16.png  \
            icon19.png  \
            icon48.png  \
            icon128.png

ICONS_SRCS=$(addprefix $(ICONS), $(_ICONS_SRCS))

_RELEASE_ZIP=In_that_book_mercari.zip
RELEASE_ZIP=$(addprefix $(RELEASE), $(_RELEASE_ZIP))

###
all: $(ICONS_SRCS) $(RELEASE_ZIP)

#
$(RELEASE_ZIP): $(MANIFEST) $(JS_SRCS) $(ICONS_SRCS)
	$(eval debug_flag := $(shell cat js/contentscript.js | grep "DEBUG_MODE =" | sed -E "s/var|DEBUG_MODE|=|;| //g"))
	@if [ $(debug_flag) = "true" ]; then \
		echo "THIS IS DEBUG MODE, So do not build"; \
	else \
		echo "zip -r $@  $(MANIFEST) $(JS) $(ICONS)"; \
		zip -r $@  $(MANIFEST) $(JS) $(ICONS); \
	fi

#
$(ICONS_SRCS): $(SOURCE_ICON)
	$(eval size := $(shell echo $@ | sed -E "s/([^0-9]*)//g"))
	convert $< -resize $(size)x  -unsharp 1.5x1+0.7+0.02 $@

.PHONY: clean
clean:
	-rm $(RELEASE_ZIP)
