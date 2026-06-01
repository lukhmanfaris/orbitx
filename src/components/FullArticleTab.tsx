import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Save, Image, X, Bold, Italic, Underline, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Link, Minus, AlertCircle, Check, Loader2, Download } from 'lucide-react';
import { marked } from 'marked';
import { useAppContext } from '../AppContext';

marked.setOptions({ breaks: true, gfm: true });

export default function FullArticleTab() {
  const {
    currentUser,
    articleFolders, selectedArticleFolderId, selectedArticleId, setSelectedArticleId,
    articleTitle, setArticleTitle,
    articleBody, setArticleBody,
    articlePreparedBy, setArticlePreparedBy,
    articleDate, setArticleDate,
    articleError, setArticleError,
    articleCoverImage, setArticleCoverImage,
    handleSaveEditorArticle,
    handleDeleteArticle,
    articles,
  } = useAppContext();

  const [previewMode, setPreviewMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedType, setCopiedType] = useState<'text' | 'html' | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isNew = selectedArticleId === 'new';
  const selectedFolder = articleFolders.find(f => f.id === selectedArticleFolderId);
  const existingArticle = articles.find(a => a.id === selectedArticleId);

  useEffect(() => {
    if (isNew && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isNew]);

  const handleSave = async () => {
    await handleSaveEditorArticle();
  };

  const handleCoverFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploadingCover(true);
    try {
      const presignedRes = await fetch(`/api/upload/presigned-url?filename=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`);
      if (!presignedRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, publicUrl, fileType } = await presignedRes.json();
      const s3PutRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': fileType }, body: file });
      if (!s3PutRes.ok) throw new Error('Upload failed');
      setArticleCoverImage(publicUrl);
    } catch (err) {
      console.error('Cover image upload failed:', err);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleCoverFile(file);
  };

  const insertMarkdown = (before: string, after: string = '', lineStart: boolean = false) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = articleBody;
    const selected = text.substring(start, end);

    if (lineStart) {
      const lineStartIdx = text.lastIndexOf('\n', start - 1) + 1;
      const newText = text.substring(0, lineStartIdx) + before + text.substring(lineStartIdx);
      setArticleBody(newText);
      setTimeout(() => {
        ta.selectionStart = start + before.length;
        ta.selectionEnd = end + before.length;
        ta.focus();
      }, 0);
    } else {
      const replacement = selected ? before + selected + after : before + 'text' + after;
      const newText = text.substring(0, start) + replacement + text.substring(end);
      setArticleBody(newText);
      setTimeout(() => {
        if (selected) {
          ta.selectionStart = start + before.length;
          ta.selectionEnd = start + before.length + selected.length;
        } else {
          ta.selectionStart = start + before.length;
          ta.selectionEnd = start + before.length + 4;
        }
        ta.focus();
      }, 0);
    }
  };

  const wordCount = articleBody.trim().split(/\s+/).filter(Boolean).length;

  const getPreviewHtml = () => {
    try {
      return marked(articleBody || '') as string;
    } catch {
      return '';
    }
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(articleBody);
    setCopiedType('text');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyHtml = async () => {
    await navigator.clipboard.writeText(marked(articleBody || '') as string);
    setCopiedType('html');
    setTimeout(() => setCopiedType(null), 2000);
  };

  if (!currentUser) return null;

  return (
    <div className="flex-1 flex flex-col bg-[#fafafa] overflow-y-auto">
      {/* Top bar */}
      <div className="bg-white border-b border-neutral-200 px-3 md:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => { setSelectedArticleId(''); setArticleError(''); }}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 px-3 py-1.5 rounded-lg transition-colors border border-neutral-200 flex-shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to {selectedFolder?.name || 'Articles'}</span>
            <span className="sm:hidden">Back</span>
          </button>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isNew ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {isNew ? 'Draft' : 'Published'}
          </span>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-3 md:px-6 py-6 space-y-5">
        {articleError && (
          <div className="flex items-center gap-2 text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{articleError}</span>
          </div>
        )}

        {/* Cover image */}
        <div
          className={`relative w-full h-40 rounded-xl border-2 border-dashed transition-colors overflow-hidden ${isDragOver ? 'border-neutral-900 bg-neutral-100' : articleCoverImage ? 'border-transparent' : 'border-neutral-300 bg-neutral-50'}`}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
          onDrop={handleCoverDrop}
          onClick={() => !uploadingCover && coverInputRef.current?.click()}
        >
          {uploadingCover ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
              <span className="text-xs text-neutral-500 font-medium">Uploading cover...</span>
            </div>
          ) : articleCoverImage ? (
            <>
              <img src={articleCoverImage} alt="Cover" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setArticleCoverImage(''); }}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const a = document.createElement('a');
                  a.href = articleCoverImage;
                  a.download = articleCoverImage.split('/').pop()?.split('?')[0] || 'cover';
                  a.click();
                }}
                className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-lg transition-colors"
                title="Download cover image"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer">
              <Image className="w-6 h-6 text-neutral-400" />
              <span className="text-xs text-neutral-500 font-medium">Drop cover image or click to browse</span>
            </div>
          )}
          <input
            type="file"
            ref={coverInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleCoverFile(e.target.files[0]); }}
          />
        </div>

        {/* Title */}
        <input
          type="text"
          value={articleTitle}
          onChange={(e) => setArticleTitle(e.target.value)}
          placeholder="Article title..."
          autoFocus={isNew}
          className="w-full text-[28px] font-bold text-neutral-900 bg-transparent border-none outline-none placeholder:text-neutral-300 leading-tight tracking-tight"
        />

        {/* Meta row */}
        <div className="text-sm text-neutral-400">
          By {articlePreparedBy || currentUser.username} · {articleDate || new Date().toISOString().split('T')[0]}
        </div>

        {/* Formatting toolbar */}
        <div className="sticky top-[57px] z-10 bg-white border border-neutral-200 rounded-xl p-1.5 flex flex-wrap items-center gap-0.5 shadow-xs">
          <button type="button" onClick={() => insertMarkdown('**', '**')} className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
          <button type="button" onClick={() => insertMarkdown('*', '*')} className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
          <button type="button" onClick={() => insertMarkdown('<u>', '</u>')} className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors" title="Underline"><Underline className="w-4 h-4" /></button>
          <div className="w-px h-5 bg-neutral-200 mx-1" />
          <button type="button" onClick={() => insertMarkdown('# ', '', true)} className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
          <button type="button" onClick={() => insertMarkdown('## ', '', true)} className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
          <button type="button" onClick={() => insertMarkdown('### ', '', true)} className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors" title="Heading 3"><Heading3 className="w-4 h-4" /></button>
          <div className="w-px h-5 bg-neutral-200 mx-1" />
          <button type="button" onClick={() => insertMarkdown('- ', '', true)} className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors" title="Bullet list"><List className="w-4 h-4" /></button>
          <button type="button" onClick={() => insertMarkdown('1. ', '', true)} className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors" title="Numbered list"><ListOrdered className="w-4 h-4" /></button>
          <button type="button" onClick={() => insertMarkdown('> ', '', true)} className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors" title="Quote"><Quote className="w-4 h-4" /></button>
          <div className="w-px h-5 bg-neutral-200 mx-1" />
          <button type="button" onClick={() => insertMarkdown('[', '](url)')} className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors" title="Link"><Link className="w-4 h-4" /></button>
          <button type="button" onClick={() => insertMarkdown('\n---\n')} className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors" title="Horizontal rule"><Minus className="w-4 h-4" /></button>
        </div>

        {/* Write/Preview toggle */}
        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5 w-fit">
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${!previewMode ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${previewMode ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Preview
          </button>
        </div>

        {/* Editor / Preview */}
        {previewMode ? (
          <div className="relative bg-white rounded-xl p-4 min-h-[400px] border border-neutral-200">
            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={handleCopyText}
                className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1.5 bg-white"
              >
                {copiedType === 'text' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : null}
                <span>Copy Text</span>
              </button>
              <button
                type="button"
                onClick={handleCopyHtml}
                className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1.5 bg-white"
              >
                {copiedType === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : null}
                <span>Copy HTML</span>
              </button>
            </div>
            <div
              className="article-preview text-neutral-800 pt-10"
              dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
            />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={articleBody}
            onChange={(e) => setArticleBody(e.target.value)}
            placeholder="Write your article in markdown..."
            className="w-full min-h-[400px] text-sm text-neutral-800 leading-[1.8] bg-white border border-neutral-200 rounded-xl p-4 focus:border-neutral-400 focus:ring-0 transition-colors resize-y font-mono"
          />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 pb-8">
          <div>
            {!isNew && existingArticle && (
              <button
                type="button"
                onClick={() => handleDeleteArticle(existingArticle.id)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
              >
                Delete article
              </button>
            )}
          </div>
          <span className="text-xs text-neutral-400 font-mono">{wordCount} words</span>
          <button
            type="button"
            onClick={handleSave}
            className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg px-6 py-2 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
