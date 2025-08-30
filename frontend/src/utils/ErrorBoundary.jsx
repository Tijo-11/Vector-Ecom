import { Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong in StoreHeader.</h1>;
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
