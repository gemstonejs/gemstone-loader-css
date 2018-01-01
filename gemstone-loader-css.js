/*
**  GemstoneJS -- Gemstone JavaScript Technology Stack
**  Copyright (c) 2016-2018 Gemstone Project <http://gemstonejs.com>
**  Licensed under Apache License 2.0 <https://spdx.org/licenses/Apache-2.0>
*/

/*  load external requirements  */
const co                  = require("co")
const loaderUtils         = require("loader-utils")
const inlineAssets        = require("inline-assets")
const PostCSS             = require("postcss")
const PostCSSSCSS         = require("postcss-scss")
const PreCSS              = require("precss")
const CSSNext             = require("postcss-cssnext")
const PostCSSImport       = require("postcss-import")
const PostCSSAlias        = require("postcss-alias")
const PostCSSEasings      = require("postcss-easings")
const PostCSSHexRGBA      = require("postcss-hexrgba")
const PostCSSScope        = require("style-scope/postcss")
const Autoprefixer        = require("autoprefixer")

/*  the exported Webpack loader function  */
module.exports = function (content) {
    const done = this.async()
    co(function * () {
        /*  determine Webpack loader query parameters  */
        const options = Object.assign({}, {
            scope: "none"
        }, loaderUtils.getOptions(this), this.resourceQuery ? loaderUtils.parseQuery(this.resourceQuery) : null)

        /*  indicate to Webpack that our results are
            fully deterministic and can be cached  */
        this.cacheable(true)

        /*  transpile CSS via PostCSS/LESS/Scope/Autoprefixer */
        let result = yield PostCSS([
            PostCSSImport(),
            PreCSS({
                /*  disable referenced plugin which makes trouble because of PostCSS 5/6,
                    although itself does not require PostCSS 5 (strange)  */
                "import":    { disable: true },

                /*  disable referenced plugins which still require PostCSS 5  */
                "variables": { disable: true },
                "at-root":   { disable: true },
                "extend":    { disable: true },
                "lookup":    { disable: true }
            }),
            CSSNext({
                features: {
                    /*  disable CSSNext's PostCSS plugins which are already in PreCSS
                        (see also https://github.com/timaschew/postcss-compare-packs)  */
                    colorFunction:      false, /*  postcss-color-function  */
                    customMedia:        false, /*  postcss-custom-media  */
                    customProperties:   false, /*  postcss-custom-properties  */
                    customSelectors:    false, /*  postcss-custom-selectors  */
                    mediaQueriesRange:  false, /*  postcss-media-minmax  */
                    nesting:            false, /*  postcss-nesting  */
                    pseudoClassMatches: false, /*  postcss-selector-matches  */
                    pseudoClassNot:     false, /*  postcss-selector-not  */

                    /*  disable CSSNext's PostCSS plugin Autoprefixer, as we add
                        it outself at the end of the processing  */
                    autoprefixer:       false
                }
            }),
            PostCSSAlias(),
            PostCSSEasings(),
            PostCSSHexRGBA(),
            PostCSSScope({
                rootScope: options.scope
            }),
            Autoprefixer({
                browsers: [ "last 2 versions" ]
            })
        ]).process(content, {
            from:   this.resourcePath,
            to:     this.resourcePath,
            parser: PostCSSSCSS,
            map:    { inline: true }
        }).catch((err) => {
            this.emitError(`gemstone-loader-css: PostCSS [transpile]: ERROR: ${err}`)
        })
        if (typeof result === "object" && typeof result.warnings === "function") {
            let warnings = result.warnings()
            if (warnings.length > 0)
                this.emitError(`gemstone-loader-css: PostCSS [transpile]: ERROR: ${warnings.join("\n")}`)
        }
        if (typeof result === "object" && typeof result.css === "string")
            result = result.css
        else
            result = "/* INTERNAL ERROR */"

        /*  inline all referenced assets to be self-contained  */
        result = inlineAssets(this.resourcePath, this.resourcePath, result, {
            htmlmin: false,
            cssmin:  this.minimize,
            jsmin:   false,
            pattern: [ ".+" ],
            purge:   false
        })

        /*  generate output  */
        result = "module.exports = " + JSON.stringify(result)

        done(null, result)
    }.bind(this)).catch((err) => {
        this.emitError("gemstone-loader-css: ERROR: " + err)
        done(err)
    })
}

