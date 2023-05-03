import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"

import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { ListItemNode, ListNode } from "@lexical/list"
import { TRANSFORMERS } from "@lexical/markdown"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table"
import { useEffect, useState } from "react"
import ToolbarPlugin from "./Editor/Plugins/ToolbarPlugin"

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getRoot, ParagraphNode } from "lexical"
import CodeHighlightPlugin from "./Editor/Plugins/CodeHighlightPlugin"
import AutoLinkPlugin from "./Editor/Plugins/EditorAutoLinkPlugin"
import ListMaxIndentLevelPlugin from "./Editor/Plugins/ListMaxIndentLevelPlugin"

function onError(e) {
	console.log(e)
}

const UpdateText = ({ onChange, initialValue }) => {

	const [data, setData] = useState("");
	const [state, setState] = useState(false)

	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		if (!state) {
			setState(true);
			editor.update(() => {
				const parser = new DOMParser()
				const dom = parser.parseFromString(initialValue, 'text/html')
				const nodes = $generateNodesFromDOM(editor, dom)
				const root = $getRoot()
				nodes.forEach((node) => root.append(node))

			})
		} else {
			editor.update(() => {
				const parser = new DOMParser();
				if (onChange && editor.isComposing()) {
					onChange($generateHtmlFromNodes(editor),)
				}
			})
		}
	})
}
export const Editor = ({ onChange, onBlur, className, value }) => {

		const initialConfig = {
		namespace: className + '-Editor',
		onError: onError,
		nodes: [
			ParagraphNode,
			HeadingNode,
			ListNode,
			ListItemNode,
			QuoteNode,
			CodeNode,
			CodeHighlightNode,
			TableNode,
			TableCellNode,
			TableRowNode,
			AutoLinkNode,
			LinkNode
		]
	};

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<div className={className + "-container"}>
				<ToolbarPlugin className={className + "-toolbar"} />
				<div className={className + "-inner"}>
					<RichTextPlugin
						contentEditable={<ContentEditable className={className + "-input"} value={value} />}
						ErrorBoundary={LexicalErrorBoundary}
					/>
					<HistoryPlugin />
					<CodeHighlightPlugin />
					<ListPlugin />
					<LinkPlugin />
					<AutoLinkPlugin />
					<ListMaxIndentLevelPlugin maxDepth={7} />
					<MarkdownShortcutPlugin transformers={TRANSFORMERS} />
					<UpdateText onChange={onChange} initialValue={value} />
				</div>
			</div>
		</LexicalComposer>
	)
}