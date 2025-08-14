import { useEffect, useMemo, useState } from "react";

type ServerPrompt = {
	_id: string;
	title: string;
	prompt: string;
	tags: string[];
	isCommunity: boolean;
	date?: string;
	updatedAt?: string;
};

type CommunityItem = {
	id: string;
	title: string;
	prompt: string;
	tags: string[];
	createdAt: string;
};

const API_ROOT: string =
	(import.meta as any).env?.VITE_API_ROOT ||
	((import.meta as any).env?.VITE_API_BASE_URL
		? (import.meta as any).env.VITE_API_BASE_URL.replace(/\/auth\/?$/, "")
		: "");

async function safeJson(res: Response) {
	try {
		return await res.json();
	} catch {
		return null;
	}
}

export default function Community() {
	const [items, setItems] = useState<CommunityItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string>("");
	const [search, setSearch] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [sortKey, setSortKey] = useState<
		"newest" | "oldest" | "title_az" | "title_za"
	>("newest");

	useEffect(() => {
		const fetchCommunity = async () => {
			if (!API_ROOT) {
				setErr("API root not configured. Set VITE_API_ROOT.");
				setLoading(false);
				return;
			}
			setErr("");
			setLoading(true);
			try {
				const res = await fetch(`${API_ROOT}/prompts/community`, {
					method: "GET",
					credentials: "include", // remove if you make community endpoint public
				});

				if (res.status === 401) {
					window.location.href = "/login";
					return;
				}

				if (!res.ok) {
					const data = await safeJson(res);
					throw new Error(data?.message || "Failed to load community prompts");
				}

				const data = await res.json();
				const list: ServerPrompt[] = Array.isArray(data?.prompts)
					? data.prompts
					: [];

				const mapped: CommunityItem[] = list.map((p) => ({
					id: p._id,
					title: p.title,
					prompt: p.prompt,
					tags: Array.isArray(p.tags) ? p.tags.filter(Boolean).map(String) : [],
					createdAt: p.date
						? new Date(p.date).toISOString()
						: new Date().toISOString(),
				}));

				setItems(mapped);
			} catch (e: any) {
				setErr(e?.message || "Something went wrong");
			} finally {
				setLoading(false);
			}
		};

		fetchCommunity();
	}, []);

	const allTags = useMemo(() => {
		const s = new Set<string>();
		items.forEach((i) => i.tags.forEach((t) => t && s.add(t)));
		return Array.from(s).sort((a, b) => a.localeCompare(b));
	}, [items]);

	const filtered = useMemo(() => {
		let list = [...items];

		if (selectedTags.length) {
			list = list.filter((i) => i.tags.some((t) => selectedTags.includes(t)));
		}

		if (search.trim()) {
			const q = search.toLowerCase();
			list = list.filter(
				(i) =>
					i.title.toLowerCase().includes(q) ||
					i.prompt.toLowerCase().includes(q) ||
					i.tags.some((t) => t.toLowerCase().includes(q)),
			);
		}

		switch (sortKey) {
			case "newest":
				list.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				);
				break;
			case "oldest":
				list.sort(
					(a, b) =>
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
				);
				break;
			case "title_az":
				list.sort((a, b) => a.title.localeCompare(b.title));
				break;
			case "title_za":
				list.sort((a, b) => b.title.localeCompare(a.title));
				break;
		}

		return list;
	}, [items, selectedTags, search, sortKey]);

	const toggleTag = (tag: string) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
		);
	};

	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {}
	};

	return (
		<section className="flex h-dvh flex-1 bg-white-2">
			<div className="mx-auto flex w-11/12 max-w-6xl flex-col gap-6 pt-14 pb-10">
				<div className="flex items-center gap-3">
					<img src="./logo-dark.svg" alt="logo" className="h-12" />
					<h1 className="font-normal text-4xl tracking-tight">
						Community{" "}
						<span className="text-gray-500 text-xl">/ Public Prompts</span>
					</h1>
				</div>

				{err && (
					<div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-600 text-sm">
						{err}
					</div>
				)}

				<div className="flex flex-col gap-4 rounded-md border border-gray-2 bg-gray-1 p-4">
					<div className="flex flex-wrap items-center gap-4">
						<div className="relative min-w-[260px] flex-1">
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search title, prompt, tag..."
								className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-400"
							/>
							{search && (
								<button
									type="button"
									onClick={() => setSearch("")}
									className="-translate-y-1/2 absolute top-1/2 right-2 text-gray-500 hover:text-black"
									title="Clear"
								>
									<i className="ri-close-circle-line" />
								</button>
							)}
						</div>

						<div className="flex items-center gap-2">
							<select
								value={sortKey}
								onChange={(e) => setSortKey(e.target.value as any)}
								className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:cursor-pointer focus:border-gray-500 focus:ring-1 focus:ring-gray-400"
								title="Sort"
							>
								<option value="newest">Newest first</option>
								<option value="oldest">Oldest first</option>
								<option value="title_az">Title A → Z</option>
								<option value="title_za">Title Z → A</option>
							</select>
						</div>

						<button
							type="button"
							onClick={() => {
								setSelectedTags([]);
								setSearch("");
								setSortKey("newest");
							}}
							className="rounded-md border border-gray-300 bg-white px-3 py-2 font-medium text-xs shadow-sm transition-colors hover:cursor-pointer hover:bg-gray-100"
						>
							Reset Filters
						</button>
					</div>

					<div className="flex flex-wrap gap-2">
						{allTags.length === 0 ? (
							<p className="text-gray-500 text-xs">No tags yet.</p>
						) : (
							allTags.map((tag) => {
								const active = selectedTags.includes(tag);
								return (
									<button
										type="button"
										key={tag}
										onClick={() => toggleTag(tag)}
										className={`rounded-full px-3 py-1 font-semibold text-[11px] tracking-wide transition-colors hover:cursor-pointer ${
											active
												? "bg-black-1 text-white"
												: "bg-gray-2 text-black-1 hover:bg-gray-3"
										}`}
									>
										#{tag}
									</button>
								);
							})
						)}
					</div>
				</div>

				<div className="scrollbar-hide flex flex-wrap gap-4 overflow-scroll">
					{loading ? (
						<div className="w-full rounded-md border border-gray-200 bg-gray-50 p-10 text-center text-gray-500 text-sm">
							Loading community prompts...
						</div>
					) : filtered.length === 0 ? (
						<div className="w-full rounded-md border border-gray-200 bg-gray-50 p-10 text-center text-gray-500 text-sm">
							No community prompts found.
						</div>
					) : (
						filtered.map((item) => (
							<div
								key={item.id}
								className="group flex h-56 w-[calc(50%-0.5rem)] min-w-[300px] flex-col gap-2 overflow-hidden rounded-md border border-gray-2 bg-gray-1 p-3 transition-colors hover:border-gray-3"
							>
								<div className="flex items-start justify-between gap-2">
									<h2 className="line-clamp-2 font-medium leading-snug">
										{item.title}
									</h2>
									<div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
										<button
											type="button"
											onClick={() => copy(item.prompt)}
											className="text-gray-600 hover:cursor-pointer hover:text-black"
											title="Copy"
										>
											<i className="ri-file-copy-line" />
										</button>
									</div>
								</div>
								<p className="scrollbar-hide flex-1 overflow-scroll font-mono text-[11px] leading-relaxed">
									{item.prompt}
								</p>
								<div className="flex flex-wrap items-center gap-2 pt-1">
									<span className="rounded-full bg-black-1 px-2 py-0.5 font-semibold text-[9px] text-white uppercase tracking-wide">
										Community
									</span>
									{item.tags.map((t) => (
										<span
											key={t}
											className="rounded-full bg-gray-3 px-2 py-0.5 font-semibold text-[10px] text-black-1 tracking-wide"
										>
											#{t}
										</span>
									))}
									<span className="ml-auto text-[10px] text-gray-500">
										{new Date(item.createdAt).toLocaleDateString()}
									</span>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</section>
	);
}
