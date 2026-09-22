import { checkDatabaseConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const isConnected = await checkDatabaseConnection();

  return (
    <main className="container">
      <h1>Greece Chauffeur</h1>
      <h2>Project Connection Test</h2>
      <p>This deployment is working correctly.</p>
      <p className="status">
        Database:{" "}
        <span className={isConnected ? "ok" : "fail"}>
          {isConnected ? "Connected" : "Not Connected"}
        </span>
      </p>
    </main>
  );
}
