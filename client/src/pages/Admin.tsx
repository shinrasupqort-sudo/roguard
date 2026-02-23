import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  // redirect unauthenticated users; once we have user we still check role
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [isAuthorized, setIsAuthorized] = useState(false);

  const usersQuery = trpc.admin.listUsers.useQuery(undefined, { enabled: isAuthorized });
  const logsQuery = trpc.admin.getAuthLogs.useQuery(undefined, { enabled: isAuthorized });

  useEffect(() => {
    if (!loading && user) {
      setIsAuthorized(user.role === "admin");
      if (user.role !== "admin") {
        toast.error("Access denied");
      }
    }
  }, [loading, user]);

  if (loading || usersQuery.isLoading || logsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center">Not found</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Banned</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {usersQuery.data?.map((u: any) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.id}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">{u.isBanned ? "yes" : "no"}</td>
                <td className="p-2 space-x-2">
                  {u.role !== "admin" && (
                    <button
                      className="text-green-600"
                      onClick={async () => {
                        try {
                          await trpc.admin.setUserRole.mutateAsync({ id: u.id, role: "admin" });
                          usersQuery.refetch();
                        } catch (err: any) {
                          toast.error(err.message || "Failed");
                        }
                      }}
                    >
                      make admin
                    </button>
                  )}
                  {u.role === "admin" && (
                    <button
                      className="text-yellow-600"
                      onClick={async () => {
                        try {
                          await trpc.admin.setUserRole.mutateAsync({ id: u.id, role: "user" });
                          usersQuery.refetch();
                        } catch (err: any) {
                          toast.error(err.message || "Failed");
                        }
                      }}
                    >
                      revoke admin
                    </button>
                  )}
                  {u.isBanned ? (
                    <button
                      className="text-blue-600"
                      onClick={async () => {
                        try {
                          await trpc.admin.unbanUser.mutateAsync({ id: u.id });
                          usersQuery.refetch();
                        } catch (err: any) {
                          toast.error(err.message || "Failed");
                        }
                      }}
                    >
                      unban
                    </button>
                  ) : (
                    <button
                      className="text-red-600"
                      onClick={async () => {
                        try {
                          await trpc.admin.banUser.mutateAsync({ id: u.id, reason: "manual" });
                          usersQuery.refetch();
                        } catch (err: any) {
                          toast.error(err.message || "Failed");
                        }
                      }}
                    >
                      ban
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Auth logs (recent)</h2>
        <ul className="space-y-1 text-sm">
          {logsQuery.data?.map((log: any, idx: number) => (
            <li key={idx} className="border-b py-1">
              [{new Date(log.timestamp).toLocaleString()}] {log.action} {log.email || ""} {log.ip ? `ip=${log.ip}` : ""} {log.success === false ? "(failed)" : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}