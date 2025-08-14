import { useEffect, useMemo, useState } from "react";

type User = {
	id: string;
	username: string;
	email?: string;
};

type ServerPrompt = {
	_id: string;
	title: string;
	prompt: string;
	tags: string[];
	isCommunity: boolean;
	date?: string;
	updatedAt?: string;
};

const API_ROOT: string =
	(import.meta as any).env?.VITE_API_ROOT ||
	((import.meta as any).env?.VITE_API_BASE_URL
		? (import.meta as any).env.VITE_API_BASE_URL.replace(/\/auth\/?$/, "")
		: "");

const AUTH_BASE: string =
	(import.meta as any).env?.VITE_API_BASE_URL ||
	(API_ROOT ? `${API_ROOT}/auth` : "");

async function safeJson(res: Response) {
	try {
		return await res.json();
	} catch {
		return null;
	}
}

export default function Profile() {
	const [loading, setLoading] = useState(true);
	const [loadingPrompts, setLoadingPrompts] = useState(true);
	const [error, setError] = useState<string>("");
	const [user, setUser] = useState<User | null>(null);
	const [prompts, setPrompts] = useState<ServerPrompt[]>([]);
	const [logoutLoading, setLogoutLoading] = useState(false);

	// Fetch current user from auth token endpoint
	useEffect(() => {
		const fetchUser = async () => {
			if (!AUTH_BASE) {
				setError("Auth API not configured. Set VITE_API_BASE_URL.");
				setLoading(false);
				return;
			}
			try {
				const res = await fetch(`${AUTH_BASE}/login`, {
					method: "GET",
					credentials: "include",
				});

				if (res.status === 401) {
					// Not logged in
					window.location.href = "/login";
					return;
				}

				const data = await safeJson(res);
				const u = data?.user;
				if (!res.ok || !u) {
					throw new Error(data?.message || "Failed to load user");
				}
				setUser({
					id: u.id || u._id || "",
					username: u.username || "",
					email: u.email,
				});
			} catch (e: any) {
				setError(e?.message || "Could not fetch profile");
			} finally {
				setLoading(false);
			}
		};

		fetchUser();
	}, []);

	useEffect(() => {
		const fetchPrompts = async () => {
			if (!API_ROOT) {
				setLoadingPrompts(false);
				return;
			}
			try {
				const res = await fetch(`${API_ROOT}/prompts`, {
					method: "GET",
					credentials: "include",
				});

				if (res.status === 401) {
					window.location.href = "/login";
					return;
				}

				if (!res.ok) {
					const data = await safeJson(res);
					throw new Error(data?.message || "Failed to load prompts");
				}

				const data = await res.json();
				const serverPrompts = Array.isArray(data?.prompts) ? data.prompts : [];
				setPrompts(serverPrompts);
			} catch {
			} finally {
				setLoadingPrompts(false);
			}
		};

		fetchPrompts();
	}, []);

	const initials = useMemo(() => {
		if (!user?.username) return "?";
		const parts = user.username.trim().split(/\s+/);
		const first = parts[0]?.[0] || "";
		const second = parts[1]?.[0] || "";
		return (first + second).toUpperCase();
	}, [user]);

	const stats = useMemo(() => {
		const total = prompts.length;
		const community = prompts.filter((p) => p.isCommunity).length;
		const tagSet = new Set<string>();
		prompts.forEach((p) =>
			Array.isArray(p.tags)
				? p.tags.forEach((t) => t && tagSet.add(String(t)))
				: null,
		);
		return {
			total,
			community,
			tags: tagSet.size,
		};
	}, [prompts]);

	const handleLogout = async () => {
		setLogoutLoading(true);
		try {
			if (AUTH_BASE) {
				const res = await fetch(`${AUTH_BASE}/logout`, {
					method: "POST",
					credentials: "include",
				});
				if (!res.ok) {
				}
			}
		} catch {
		} finally {
			window.location.href = "/login";
		}
	};

	return (
		<section className="flex h-dvh flex-1 bg-white-2">
			<div className="mx-auto flex w-11/12 max-w-3xl flex-col gap-6 pt-14 pb-10">
				<div className="flex items-center gap-3">
					<img src="./logo-dark.svg" alt="logo" className="h-12" />
					<h1 className="font-normal text-4xl tracking-tight">
						Profile{" "}
						<span className="text-gray-500 text-xl">/ Prompt Vault</span>
					</h1>
				</div>

				{error && (
					<div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-600 text-sm">
						{error}
					</div>
				)}

				<div className="flex flex-col gap-4 rounded-md border border-gray-2 bg-gray-1 p-4">
					{loading ? (
						<div className="text-gray-500 text-sm">Loading profile...</div>
					) : user ? (
						<div className="flex items-start gap-4">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-black-1 font-semibold text-white text-xl">
								{initials}
							</div>
							<div className="flex flex-1 flex-col">
								<h2 className="font-medium text-xl">{user.username}</h2>
								<p className="text-gray-600 text-sm">
									{user.email || "No email"}
								</p>
								<div className="mt-3 flex flex-wrap gap-2">
									<a
										href="/dashboard"
										className="rounded-md border border-gray-300 bg-white px-3 py-2 font-medium text-xs shadow-sm transition-colors hover:bg-gray-100"
									>
										Go to Dashboard
									</a>
									<button
										type="button"
										onClick={handleLogout}
										disabled={logoutLoading}
										className="rounded-md bg-black-1 px-3 py-2 font-medium text-white text-xs transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
									>
										{logoutLoading ? "Logging out..." : "Logout"}
									</button>
								</div>
							</div>
						</div>
					) : (
						<div className="text-gray-500 text-sm">No profile data.</div>
					)}
				</div>

				<div className="grid grid-cols-3 gap-4">
					<div className="rounded-md border border-gray-2 bg-gray-1 p-4">
						<p className="text-gray-500 text-xs">Total Prompts</p>
						<p className="font-semibold text-3xl">
							{loadingPrompts ? "-" : stats.total}
						</p>
					</div>
					<div className="rounded-md border border-gray-2 bg-gray-1 p-4">
						<p className="text-gray-500 text-xs">Community</p>
						<p className="font-semibold text-3xl">
							{loadingPrompts ? "-" : stats.community}
						</p>
					</div>
					<div className="rounded-md border border-gray-2 bg-gray-1 p-4">
						<p className="text-gray-500 text-xs">Tags Used</p>
						<p className="font-semibold text-3xl">
							{loadingPrompts ? "-" : stats.tags}
						</p>
					</div>
				</div>

				<div className="rounded-md border border-gray-2 bg-gray-1 p-4">
					<h3 className="mb-2 font-medium">Account</h3>
					<ul className="text-gray-600 text-sm">
						<li className="flex items-center justify-between py-2">
							<span>Password</span>
							<span className="text-gray-400 text-xs">
								Change password not available yet
							</span>
						</li>
						<li className="flex items-center justify-between py-2">
							<span>Email</span>
							<span className="text-gray-400 text-xs">
								Contact support to update
							</span>
						</li>
					</ul>
				</div>
			</div>
		</section>
	);
}
