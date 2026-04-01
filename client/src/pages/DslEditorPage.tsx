import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileCode, Folder, File, Save, Check, AlertTriangle, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function FileTree({ files, selectedPath, onSelect }: { files: any[]; selectedPath: string; onSelect: (path: string) => void }) {
  return (
    <div className="space-y-0.5" data-testid="dsl-file-tree">
      {files.map((f: any) => {
        if (f.type === "directory") {
          return (
            <div key={f.path}>
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
                <Folder className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">{f.path}</span>
              </div>
              {f.children && (
                <div className="ml-4">
                  <FileTree files={f.children} selectedPath={selectedPath} onSelect={onSelect} />
                </div>
              )}
            </div>
          );
        }
        return (
          <button
            key={f.path}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs w-full text-left rounded hover:bg-accent/50 ${
              selectedPath === f.path ? "bg-accent/70 text-primary" : "text-foreground"
            }`}
            onClick={() => onSelect(f.path)}
            data-testid={`dsl-file-${f.path}`}
          >
            <File className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="truncate">{f.path.split("/").pop()}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function DslEditorPage() {
  const [selectedFile, setSelectedFile] = useState("");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const { data: files } = useQuery<any[]>({ queryKey: ["/api/dsl/files"] });

  const { data: fileContent } = useQuery<any>({
    queryKey: ["/api/dsl/files", selectedFile],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/dsl/files/${selectedFile}`);
      return res.json();
    },
    enabled: !!selectedFile,
  });

  useEffect(() => {
    if (fileContent?.content !== undefined) {
      setContent(fileContent.content);
      setDirty(false);
      setValidationResult(null);
    }
  }, [fileContent]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/dsl/files/${selectedFile}`, { content });
      return res.json();
    },
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["/api/dsl/files"] });
    },
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/dsl/validate", { content, path: selectedFile });
      return res.json();
    },
    onSuccess: (data) => {
      setValidationResult(data);
    },
  });

  // Get all file paths flat
  const flatFiles = (items: any[]): string[] => {
    const result: string[] = [];
    for (const item of items) {
      if (item.type === "file") result.push(item.path);
      if (item.children) result.push(...flatFiles(item.children));
    }
    return result;
  };

  // Auto-select first file
  useEffect(() => {
    if (files && !selectedFile) {
      const paths = flatFiles(files);
      if (paths.length > 0) setSelectedFile(paths[0]);
    }
  }, [files, selectedFile]);

  return (
    <div className="h-full flex flex-col" data-testid="dsl-editor-page">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0 bg-card/50">
        <FileCode className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">DSL Editor</span>
        {selectedFile && <span className="text-xs text-muted-foreground font-mono">{selectedFile}</span>}
        {dirty && <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">unsaved</Badge>}

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => validateMutation.mutate()}
          disabled={!content || validateMutation.isPending}
          data-testid="validate-dsl"
        >
          <Play className="w-3.5 h-3.5 mr-1" />
          {validateMutation.isPending ? "Validating..." : "Validate"}
        </Button>

        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
          data-testid="save-dsl"
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* File tree sidebar */}
        <div className="w-[200px] shrink-0 border-r border-border p-2 overflow-auto">
          {files ? (
            <FileTree files={files} selectedPath={selectedFile} onSelect={setSelectedFile} />
          ) : (
            <div className="text-xs text-muted-foreground p-2">Loading files...</div>
          )}
        </div>

        {/* Editor + validation */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Code editor */}
          <div className="flex-1 min-h-0">
            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); setDirty(true); }}
              className="w-full h-full p-4 bg-background text-sm font-mono resize-none focus:outline-none leading-relaxed"
              spellCheck={false}
              data-testid="dsl-editor-textarea"
              placeholder={selectedFile ? "Loading..." : "Select a file to edit"}
            />
          </div>

          {/* Validation panel */}
          {validationResult && (
            <div className="border-t border-border p-3 bg-card/50 shrink-0 max-h-[200px] overflow-auto">
              <div className="flex items-center gap-2 mb-2">
                {validationResult.valid ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">Validation passed</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400 font-medium">Validation failed</span>
                  </>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {validationResult.errors?.length || 0} issue{validationResult.errors?.length !== 1 ? "s" : ""}
                </span>
              </div>
              {validationResult.errors?.map((err: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1">
                  <span className={`${err.severity === "error" ? "text-red-400" : "text-amber-400"}`}>
                    {err.severity}
                  </span>
                  {err.line > 0 && <span className="text-muted-foreground font-mono">L{err.line}</span>}
                  <span className="text-foreground">{err.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
