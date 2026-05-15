import { Component, type ReactNode, type ErrorInfo } from "react";

// React renders are best-effort: a single uncaught error in any descendant
// component would unmount the whole tree (and leave the NUI focus stuck open
// with nothing painted). This boundary catches those errors and swaps in a
// friendly recovery card instead — the admin can hit "Reload panel" to
// re-mount the tree without restarting the resource.

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to the FiveM dev console so server owners can debug, but never
    // re-throw — the boundary's whole job is to keep the panel reachable.
    console.error("[corex-admin] panel crashed:", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center">
        <div className="w-[440px] rounded-xl border border-rose-700/40 bg-[#16161a] p-5 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]">
          <h2 className="text-[14px] font-medium text-rose-300">Something went wrong</h2>
          <p className="mt-1 text-[12px] text-zinc-400">
            The panel hit a render error. Reload to keep working — your last action was already saved server-side.
          </p>
          <pre className="mt-3 max-h-[120px] overflow-auto rounded-md border border-[#2f2f38] bg-[#0e0e11] p-2 font-mono text-[10.5px] text-zinc-500">
            {this.state.error.message || String(this.state.error)}
          </pre>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("corex-admin:close"))}
              className="motion-soft h-8 rounded-md border border-[#2f2f38] bg-[#18181c] px-3 text-[12px] text-zinc-300 hover:border-[#383841]"
            >
              Close
            </button>
            <button
              onClick={this.reset}
              className="motion-soft h-8 rounded-md bg-zinc-100 px-3 text-[12px] font-medium text-zinc-900 hover:bg-white"
            >
              Reload panel
            </button>
          </div>
        </div>
      </div>
    );
  }
}
