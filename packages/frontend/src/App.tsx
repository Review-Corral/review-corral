import "./App.css";

function App() {
  return (
    <>
      <div>{import.meta.env.VITE_API_URL ?? "none"}</div>
      <div>Login with Github</div>
    </>
  );
}

export default App;
