import React, { useState } from "react";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Dummy search logic; replace with real API call as needed
      setTimeout(() => {
        if (query.toLowerCase() === "react") {
          setResults([
            "React Documentation",
            "React Tutorial",
            "React Community",
          ]);
        } else if (query) {
          setResults([
            `Result for "${query}" 1`,
            `Result for "${query}" 2`,
            `Result for "${query}" 3`,
          ]);
        } else {
          setResults([]);
        }
        setLoading(false);
      }, 700);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      <h1>Search</h1>
      <form onSubmit={handleSearch} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Enter search term..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: "0.5rem", width: "70%", marginRight: "0.5rem" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "0.5rem 1rem" }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <ul>
        {results.map((result, idx) => (
          <li key={idx} style={{ padding: "0.25rem 0" }}>
            {result}
          </li>
        ))}
      </ul>
      {!loading && results.length === 0 && query && !error && (
        <div>No results found.</div>
      )}
    </div>
  );
};

export default SearchPage;
