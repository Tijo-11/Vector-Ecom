// Why Use a Wrapper Component?
//Problem: Application content may be accessed before the setAuthUser function (from auth.js) completes,
// leading to incomplete or broken states.
//Solution: Use a wrapper component to delay rendering until authentication is resolved.
//Benefit: Ensures a stable application state by displaying a loader (or nothing) during authentication.
import { useEffect, useState } from "react";
import { setUser } from "../utils/auth";

const MainWrapper = ({ children }) => {
  // Initialize the 'loading' state variable and set its initial value to 'true'
  const [loading, setLoading] = useState(true);
  // Define a useEffect hook to handle side effects after component mounting
  useEffect(() => {
    // Define an asynchronous function 'handler'
    const handler = async () => {
      // Set the 'loading' state to 'true' to indicate the component is loading
      setLoading(true);
      // Perform an asynchronous user authentication action
      await setUser();
      // Set the 'loading' state to 'false' to indicate the loading process has completed
      setLoading(false);
    };
    // Call the 'handler' function immediately after the component is mounted
    handler();
  }, []);
  // Render content conditionally based on the 'loading' state
  return <>{loading ? null : children}</>;
};
export default MainWrapper;

/****************************************************
 
In React, `children` is a special prop that lets you pass JSX content between a component’s opening and 
closing tags.

---

### 🔹 What `children` Does
<MainWrapper>
  <h1>Hello World</h1>
</MainWrapper>

Inside `MainWrapper`, `children` will be:
```jsx
<h1>Hello World</h1>
```

So this line:
```js
const MainWrapper = ({ children }) => {
```
means you're accepting whatever is nested inside `<MainWrapper>` and rendering it inside that component.

---

### 🔧 Why It's Useful
- Enables **layout components** (like wrappers, modals, cards)
- Keeps components **flexible and reusable**
- Lets you **inject dynamic content** without hardcoding

---

Want a quick example of how to render `children` inside `MainWrapper` with styling or layout?
 */
