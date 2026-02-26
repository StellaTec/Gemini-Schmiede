# Architektur: PROD-BRANCH - Branch-per-Feature

## 1. Zielsetzung
Maximale Isolation von Feature-Entwicklungen. Jede Aufgabe wird in einem eigenen Git-Branch isoliert, um den Hauptzweig (`main`/`master`) jederzeit stabil zu halten.

## 2. Workflow
### 2.1 Branch-Erstellung
- Vor Beginn einer Aufgabe (ID-basiert) wird ein neuer Branch erstellt: `feature/TASK-ID`.
- Der Boss-Agent wechselt in diesen Branch, bevor er den Worker-Agenten instruiert.

### 2.2 Entwicklung & Audit
- Der Worker-Agent arbeitet ausschließlich im Feature-Branch.
- Der Quality-Inspector (Audit) validiert den Code im Feature-Branch.

### 2.3 Merge-Strategie
- Bei **Audit PASSED**: Der Feature-Branch wird in den Hauptzweig gemergt (`git merge --no-ff`).
- Bei **Audit FAILED**: Der Branch wird verworfen oder bleibt zur Fehleranalyse bestehen, ohne den Hauptzweig zu beeinflussen.

## 3. Komponente: `branch_manager.cjs`
- Utility zur Verwaltung der Branch-Lifecycle.
- Methoden: `createFeatureBranch(taskId)`, `mergeToMain(taskId)`, `abortFeature(taskId)`.

## 4. Integration
- Enge Verzahnung mit `git_integrity.cjs` (Snapshots können zusätzlich im Branch genutzt werden).
