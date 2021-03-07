import { buildRegex, getIndent, REGEX_ANY } from "./regex";
import { each, last } from "lodash";
import { Editor, Position } from "codemirror";

export interface Selection {
  hasSelection: boolean;
  start: Position;
  end: Position;
  content: string;
  editor: Editor;
  originalHead?: Position;
}

/**
 * Generate a Selection object based on the current state
 */
export const getSelection = (editor: Editor): Selection => {
  if (editor.somethingSelected()) {
    // if there is a selection, return it
    const cursorStart = editor.getCursor("from");
    const cursorEnd = editor.getCursor("to");
    const start: Position = { line: cursorStart.line, ch: 0 };
    const end: Position = {
      line: cursorEnd.line,
      ch: editor.getLine(cursorEnd.line).length,
    };
    const content = editor.getRange(start, end);
    return { start, end, content, hasSelection: true, editor };
  } else {
    // otherwise select the current line
    const { line } = editor.getCursor();
    const contents = editor.getDoc().getLine(line);
    const start = { line, ch: 0 };
    const end = { line, ch: contents.length };
    const content = editor.getRange(start, end);
    const originalHead = editor.getCursor("head");
    return {
      start,
      end,
      content,
      hasSelection: false,
      editor,
      originalHead,
    };
  }
};

/**
 * Takes a Selection object and restores the cursor if applicable
 */
export const restoreCursor = (
  { start, end, editor, hasSelection, originalHead }: Selection,
  content: string,
  updatedContent: string
): void => {
  if (hasSelection) {
    editor.setSelection(start, {
      line: end.line,
      ch: editor.getLine(end.line).length,
    });
  } else if (originalHead) {
    const { line } = originalHead;
    const delta =
      (last(updatedContent.split("\n") || [""]) as string).length -
      (last(content.split("\n") || [""]) as string).length;
    const ch = originalHead.ch + delta;
    editor.setSelection({ line, ch });
  }
};

export const wrapSelection = (content: string, wrapper: string): string =>
  [wrapper, content, wrapper].join("");

export const prefixLines = ({
  content,
  prefix,
  preserveIndent = false,
  replace = [],
}: {
  content: string;
  prefix: string;
  preserveIndent?: boolean;
  replace: string[];
}): string => {
  if (preserveIndent) {
    const lines = content.split("\n");
    each(lines, (line, index) => {
      const indent = getIndent(line);
      const content = line.replace(buildRegex([...replace, REGEX_ANY]), "");
      lines[index] = `${indent}${prefix}${content}`;
    });
    return lines.join("\n");
  } else {
    return content.replace(buildRegex([...replace, REGEX_ANY]), prefix);
  }
};
