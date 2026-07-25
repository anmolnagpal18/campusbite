import React, { Component } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import Button from './common/Button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0c0a14] px-4">
          <div className="max-w-md w-full glass-card p-8 rounded-2xl border border-red-500/20 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
                <ShieldAlert className="h-12 w-12 text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-100 mb-3">Something went wrong.</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              An unexpected rendering error occurred. Please try going back to the dashboard or refreshing the page.
            </p>
            <Button
              variant="primary"
              onClick={this.handleReset}
              icon={<RefreshCw className="h-4 w-4" />}
              className="w-full"
            >
              Go back to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
