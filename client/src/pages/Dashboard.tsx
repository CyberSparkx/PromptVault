import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

export type PromptItem = {
	id: string;
	title: string;
	prompt: string;
	tag: string;
	isCommunity: boolean;
	createdAt: string;
	updatedAt?: string;
};

type EditFormValues = {
	title: string;
	prompt: string;
	tag: string;
	isCommunity: boolean;
};

type SortKey =
	| "newest"
	| "oldest"
	| "title_az"
	| "title_za"
	| "community_first"
	| "community_only";

const LS_PROMPTS_KEY = "prompt_vault_prompts";
const LS_TAGS_KEY = "prompt_vault_tags";

const API_ROOT: string =
	(import.meta as any).env?.VITE_API_ROOT ||
	((import.meta as any).env?.VITE_API_BASE_URL
		? (import.meta as any).env.VITE_API_BASE_URL.replace(/\/auth\/?$/, "")
		: "");

function mapServerPromptToItem(p: any): PromptItem {
	return {
		id: p._id,
		title: p.title,
		prompt: p.prompt,
		tag: Array.isArray(p.tags) && p.tags.length ? String(p.tags[0]) : "",
		isCommunity: Boolean(p.isCommunity),
		createdAt: p.date
			? new Date(p.date).toISOString()
			: new Date().toISOString(),
		updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : undefined,
	};
}

async function safeJson(res: Response) {
	try {
		return await res.json();
	} catch {
		return null;
	}
}

const Dashboard = () => {
	const [allPrompts, setAllPrompts] = useState<PromptItem[]>([]);
	const [availableTags, setAvailableTags] = useState<string[]>([]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortKey, setSortKey] = useState<SortKey>("newest");

	const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
	const [showEditModal, setShowEditModal] = useState(false);

	const [addingTagMode, setAddingTagMode] = useState(false);
	const [newTagInput, setNewTagInput] = useState("");
	const [newTagError, setNewTagError] = useState("");
	const newTagRef = useRef<HTMLInputElement | null>(null);

	const [loading, setLoading] = useState(false);
	const [errMsg, setErrMsg] = useState<string>("");
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting, isDirty },
		setValue,
		watch,
	} = useForm<EditFormValues>();

	const watchIsCommunity = watch("isCommunity");

	const sanitizeTag = (raw: string) => {
		let cleaned = raw.replace(/\s+/g, "");
		cleaned = cleaned.replace(/[^a-zA-Z0-9-_]/g, "");
		return cleaned;
	};

	const deriveTags = useCallback((prompts: PromptItem[]) => {
		const tags = Array.from(
			new Set(
				prompts
					.map((p) => p.tag)
					.filter(Boolean)
					.map((t) => t.trim()),
			),
		).sort((a, b) => a.localeCompare(b));
		setAvailableTags(tags);
	}, []);

	useEffect(() => {
		try {
			const rawPrompts = localStorage.getItem(LS_PROMPTS_KEY);
			const rawTags = localStorage.getItem(LS_TAGS_KEY);
			let parsedPrompts: PromptItem[] = [];

			if (rawPrompts) {
				parsedPrompts = JSON.parse(rawPrompts).map((p: any) => ({
					...p,
					createdAt: p.createdAt || new Date().toISOString(),
				}));
			}
			setAllPrompts(parsedPrompts);

			if (rawTags) {
				const parsedTags: string[] = JSON.parse(rawTags);
				setAvailableTags(parsedTags);
			} else {
				deriveTags(parsedPrompts);
			}
		} catch (e) {
			console.warn("Failed to parse localStorage prompts", e);
		}
	}, [deriveTags]);

	useEffect(() => {
		const fetchPrompts = async () => {
			if (!API_ROOT) {
				console.warn("API root not configured. Set VITE_API_ROOT.");
				return;
			}
			setLoading(true);
			setErrMsg("");
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
				const mapped = serverPrompts.map(mapServerPromptToItem);

				setAllPrompts(mapped);
				deriveTags(mapped);
				localStorage.setItem(LS_PROMPTS_KEY, JSON.stringify(mapped));
				localStorage.setItem(
					LS_TAGS_KEY,
					JSON.stringify(
						Array.from(new Set(mapped.map((p) => p.tag).filter(Boolean))).sort(
							(a, b) => a.localeCompare(b),
						),
					),
				);
			} catch (e: any) {
				setErrMsg(e?.message || "Could not fetch prompts");
			} finally {
				setLoading(false);
			}
		};

		fetchPrompts();
	}, []);

	useEffect(() => {
		const handler = (e: StorageEvent) => {
			if (e.key === LS_PROMPTS_KEY && e.newValue) {
				try {
					const parsed: PromptItem[] = JSON.parse(e.newValue);
					setAllPrompts(parsed);
					deriveTags(parsed);
				} catch {}
			}
			if (e.key === LS_TAGS_KEY && e.newValue) {
				try {
					const parsed: string[] = JSON.parse(e.newValue);
					setAvailableTags(parsed);
				} catch {}
			}
		};
		window.addEventListener("storage", handler);
		return () => window.removeEventListener("storage", handler);
	}, [deriveTags]);

	const persist = (prompts: PromptItem[], tags?: string[]) => {
		localStorage.setItem(LS_PROMPTS_KEY, JSON.stringify(prompts));
		setAllPrompts(prompts);
		if (tags) {
			localStorage.setItem(LS_TAGS_KEY, JSON.stringify(tags));
			setAvailableTags(tags);
		} else {
			deriveTags(prompts);
		}
	};

	const visiblePrompts = useMemo(() => {
		let list = [...allPrompts];

		if (selectedTags.length) {
			list = list.filter((p) => p.tag && selectedTags.includes(p.tag));
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(p) =>
					p.title.toLowerCase().includes(q) ||
					p.prompt.toLowerCase().includes(q) ||
					(p.tag && p.tag.toLowerCase().includes(q)),
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
			case "community_first":
				list.sort((a, b) => {
					if (a.isCommunity === b.isCommunity) {
						return (
							new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
						);
					}
					return a.isCommunity ? -1 : 1;
				});
				break;
			case "community_only":
				list = list.filter((p) => p.isCommunity);
				list.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				);
				break;
		}
		return list;
	}, [allPrompts, selectedTags, searchQuery, sortKey]);

	const toggleTag = (tag: string) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
		);
	};

	const openEdit = (item: PromptItem) => {
		setEditingPrompt(item);
		reset({
			title: item.title,
			prompt: item.prompt,
			tag: item.tag || "",
			isCommunity: item.isCommunity,
		});
		setShowEditModal(true);
		setAddingTagMode(false);
		setNewTagInput("");
		setNewTagError("");
	};

	const closeEdit = () => {
		setShowEditModal(false);
		setEditingPrompt(null);
	};

	useEffect(() => {
		if (addingTagMode && newTagRef.current) {
			setTimeout(() => newTagRef.current?.focus(), 30);
		}
	}, [addingTagMode]);

	const handleNewTagChange = (val: string) => {
		const cleaned = sanitizeTag(val);
		setNewTagInput(cleaned);
		if (!cleaned) setNewTagError("Tag cannot be empty.");
		else if (availableTags.includes(cleaned)) setNewTagError("Already exists.");
		else setNewTagError("");
	};

	const commitNewTag = () => {
		if (!newTagInput.trim() || newTagError) return;
		const t = newTagInput.trim();
		const updatedTags = [...availableTags, t].sort((a, b) =>
			a.localeCompare(b),
		);
		setValue("tag", t);
		persist(allPrompts, updatedTags);
		setAddingTagMode(false);
		setNewTagInput("");
		setNewTagError("");
	};

	const onSubmit: SubmitHandler<EditFormValues> = async (data) => {
		if (!editingPrompt) return;
		if (!API_ROOT) {
			setErrMsg("API root not configured. Set VITE_API_ROOT.");
			return;
		}
		setErrMsg("");
		try {
			const body: any = {
				title: data.title.trim(),
				prompt: data.prompt.trim(),
				tags: data.tag ? [sanitizeTag(data.tag.trim())] : [], // clear when empty
				isCommunity: !!data.isCommunity,
			};

			const res = await fetch(`${API_ROOT}/prompts/${editingPrompt.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(body),
			});

			if (res.status === 401) {
				window.location.href = "/login";
				return;
			}

			if (!res.ok) {
				const r = await safeJson(res);
				throw new Error(r?.message || "Failed to update prompt");
			}

			const r = await res.json();
			const updatedServer = r?.prompt;
			const updated = updatedServer
				? mapServerPromptToItem(updatedServer)
				: {
						...editingPrompt,
						title: body.title,
						prompt: body.prompt,
						tag: body.tags[0] || "",
						isCommunity: body.isCommunity,
						updatedAt: new Date().toISOString(),
					};

			const updatedList = allPrompts.map((p) =>
				p.id === updated.id ? updated : p,
			);
			let tags = availableTags;
			if (updated.tag && !availableTags.includes(updated.tag)) {
				tags = [...availableTags, updated.tag].sort((a, b) =>
					a.localeCompare(b),
				);
			}
			persist(updatedList, tags);
			closeEdit();
		} catch (e: any) {
			setErrMsg(e?.message || "Something went wrong");
		}
	};

	const handleDelete = async (item: PromptItem) => {
		if (!confirm(`Delete "${item.title}"?`)) return;
		if (!API_ROOT) {
			setErrMsg("API root not configured. Set VITE_API_ROOT.");
			return;
		}
		setErrMsg("");
		setDeletingId(item.id);
		try {
			const res = await fetch(`${API_ROOT}/prompts/${item.id}`, {
				method: "DELETE",
				credentials: "include",
			});

			if (res.status === 401) {
				window.location.href = "/login";
				return;
			}

			if (!res.ok) {
				const r = await safeJson(res);
				throw new Error(r?.message || "Failed to delete prompt");
			}

			const filtered = allPrompts.filter((p) => p.id !== item.id);
			persist(filtered);
		} catch (e: any) {
			setErrMsg(e?.message || "Delete failed");
		} finally {
			setDeletingId(null);
		}
	};

	const copyPrompt = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch {}
	};

	return (
		<div className="flex h-dvh flex-1 bg-white-2">
			<div className="mx-auto flex w-11/12 max-w-6xl flex-col gap-6 pt-14 pb-10">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<img src="./logo-dark.svg" alt="logo" className="h-12" />
						<h1 className="font-normal text-4xl tracking-tight">
							Dashboard{" "}
							<span className="text-gray-500 text-xl">/ Prompt Vault</span>
						</h1>
					</div>
					<div className="flex items-center gap-3 text-gray-500 text-xs">
						<span className="rounded-full bg-gray-2 px-3 py-1">
							Total: {allPrompts.length}
						</span>
						<span className="rounded-full bg-gray-2 px-3 py-1">
							Showing: {visiblePrompts.length}
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-4 rounded-md border border-gray-2 bg-gray-1 p-4">
					<div className="flex flex-wrap items-center gap-4">
						<div className="relative min-w-[240px] flex-1">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search title, prompt, tag..."
								className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-400"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
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
								onChange={(e) => setSortKey(e.target.value as SortKey)}
								className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:cursor-pointer focus:border-gray-500 focus:ring-1 focus:ring-gray-400"
								title="Sort"
							>
								<option value="newest">Newest first</option>
								<option value="oldest">Oldest first</option>
								<option value="title_az">Title A → Z</option>
								<option value="title_za">Title Z → A</option>
								<option value="community_first">Community first</option>
								<option value="community_only">Community only</option>
							</select>
						</div>

						<button
							type="button"
							onClick={() => {
								setSelectedTags([]);
								setSearchQuery("");
								setSortKey("newest");
							}}
							className="rounded-md border border-gray-300 bg-white px-3 py-2 font-medium text-xs shadow-sm transition-colors hover:cursor-pointer hover:bg-gray-100"
						>
							Reset Filters
						</button>
					</div>

					<div className="flex flex-wrap gap-2">
						{availableTags.length === 0 && (
							<p className="text-gray-500 text-xs">
								No tags available yet. Add some on the Home page.
							</p>
						)}
						{availableTags.map((tag) => {
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
						})}
					</div>
				</div>

				{errMsg && (
					<div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-600 text-sm">
						{errMsg}
					</div>
				)}

				<div className="scrollbar-hide flex flex-wrap gap-4 overflow-scroll">
					{loading ? (
						<div className="w-full rounded-md border border-gray-200 bg-gray-50 p-10 text-center text-gray-500 text-sm">
							Loading prompts...
						</div>
					) : visiblePrompts.length === 0 ? (
						<div className="w-full rounded-md border border-gray-200 bg-gray-50 p-10 text-center text-gray-500 text-sm">
							No prompts match the current filters.
						</div>
					) : (
						visiblePrompts.map((item) => (
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
											onClick={() => openEdit(item)}
											className="text-gray-600 hover:cursor-pointer hover:text-black"
											title="Edit"
										>
											<i className="ri-pencil-line" />
										</button>
										<button
											type="button"
											onClick={() => copyPrompt(item.prompt)}
											className="text-gray-600 hover:cursor-pointer hover:text-black"
											title="Copy"
										>
											<i className="ri-file-copy-line" />
										</button>
										<button
											type="button"
											onClick={() => handleDelete(item)}
											disabled={deletingId === item.id}
											className={`text-gray-600 hover:cursor-pointer hover:text-red-600 ${deletingId === item.id ? "cursor-not-allowed opacity-50" : ""}`}
											title={deletingId === item.id ? "Deleting..." : "Delete"}
										>
											<i className="ri-delete-bin-line" />
										</button>
									</div>
								</div>
								<p className="scrollbar-hide flex-1 overflow-scroll font-mono text-[11px] leading-relaxed">
									{item.prompt}
								</p>
								<div className="flex flex-wrap items-center gap-2 pt-1">
									{item.isCommunity && (
										<span className="rounded-full bg-black-1 px-2 py-0.5 font-semibold text-[9px] text-white uppercase tracking-wide">
											Community
										</span>
									)}
									{item.tag && (
										<span className="rounded-full bg-gray-3 px-2 py-0.5 font-semibold text-[10px] text-black-1 tracking-wide">
											#{item.tag}
										</span>
									)}
									<span className="ml-auto text-[10px] text-gray-500">
										{new Date(item.createdAt).toLocaleDateString()}
									</span>
								</div>
							</div>
						))
					)}
				</div>

				{showEditModal && editingPrompt && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center"
						role="dialog"
						aria-modal="true"
						aria-labelledby="edit-prompt-title"
						onKeyDown={(e) => {
							if (e.key === "Escape") {
								e.preventDefault();
								closeEdit();
							}
						}}
					>
						<div
							className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
							onClick={closeEdit}
						/>
						<div className="relative z-10 w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
							<div className="mb-4 flex items-start justify-between gap-4">
								<h2
									id="edit-prompt-title"
									className="font-semibold text-lg tracking-tight"
								>
									Edit Prompt
								</h2>
								<button
									type="button"
									className="text-gray-500 hover:text-black"
									onClick={closeEdit}
									title="Close"
								>
									<i className="ri-close-line text-xl" />
								</button>
							</div>

							<form
								className="flex flex-col gap-4"
								onSubmit={handleSubmit(onSubmit)}
							>
								<div className="relative">
									<input
										type="text"
										{...register("title", {
											required: "Title required",
											validate: (v) =>
												v.trim() !== "" || "Title cannot be empty",
										})}
										placeholder={
											errors.title ? (errors.title.message as string) : "Title"
										}
										className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors ${
											errors.title
												? "border-red-400 placeholder-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
												: "border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-400"
										}`}
									/>
									{errors.title && (
										<span className="-translate-y-1/2 absolute top-1/2 right-3 text-red-500">
											<i className="ri-error-warning-line" />
										</span>
									)}
								</div>

								<div className="relative">
									<textarea
										{...register("prompt", {
											required: "Prompt required",
											validate: (v) =>
												v.trim() !== "" || "Prompt cannot be empty",
										})}
										placeholder={
											errors.prompt
												? (errors.prompt.message as string)
												: "Prompt..."
										}
										className={`h-40 w-full resize-none rounded-md border px-3 py-2 font-mono text-xs outline-none transition-colors ${
											errors.prompt
												? "border-red-400 placeholder-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
												: "border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-400"
										}`}
									/>
									{errors.prompt && (
										<span className="absolute top-2 right-3 text-red-500">
											<i className="ri-error-warning-line" />
										</span>
									)}
								</div>

								<label
									className="flex cursor-pointer select-none items-center gap-2 font-medium text-xs"
									title="Mark as community / public"
								>
									<input
										type="checkbox"
										{...register("isCommunity")}
										className="peer sr-only"
									/>
									<span
										className="relative h-5 w-9 rounded-full bg-gray-300 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-black-1 peer-checked:after:translate-x-4"
										aria-hidden="true"
									/>
									<span
										className={`transition-colors ${
											watchIsCommunity ? "text-black-1" : "text-gray-500"
										}`}
									>
										Community
									</span>
								</label>

								<div className="flex flex-col gap-2">
									{!addingTagMode && (
										<div className="flex items-center gap-2">
											<select
												{...register("tag")}
												className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-400"
												defaultValue={editingPrompt.tag || ""}
												onChange={(e) => {
													if (e.target.value === "__add_new__") {
														setAddingTagMode(true);
														setValue("tag", "");
													}
												}}
											>
												<option value="">No tag</option>
												{availableTags.map((t) => (
													<option key={t} value={t}>
														{t}
													</option>
												))}
												<option value="__add_new__">+ Add new tag</option>
											</select>
											{watch("tag") && (
												<span className="rounded-full bg-gray-200 px-2 py-1 font-semibold text-[10px] tracking-wide">
													#{watch("tag")}
												</span>
											)}
										</div>
									)}

									{addingTagMode && (
										<div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
											<div className="flex items-center gap-2">
												<input
													ref={newTagRef}
													type="text"
													value={newTagInput}
													onChange={(e) => handleNewTagChange(e.target.value)}
													placeholder="e.g. productivity"
													className={`flex-1 rounded-md border px-3 py-2 text-xs outline-none transition-colors ${
														newTagError
															? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
															: "border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-400"
													}`}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.preventDefault();
															commitNewTag();
														} else if (e.key === "Escape") {
															e.preventDefault();
															setAddingTagMode(false);
															setNewTagInput("");
															setNewTagError("");
														}
													}}
												/>
												<button
													type="button"
													onClick={commitNewTag}
													disabled={!!newTagError || !newTagInput.trim()}
													className="rounded-md bg-black-1 px-3 py-2 font-medium text-white text-xs transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
												>
													Add
												</button>
												<button
													type="button"
													onClick={() => {
														setAddingTagMode(false);
														setNewTagInput("");
														setNewTagError("");
													}}
													className="rounded-md border border-gray-300 bg-white px-3 py-2 font-medium text-xs hover:bg-gray-100"
												>
													Cancel
												</button>
											</div>
											<p className="text-[11px] text-gray-500">
												No spaces. Allowed: a-z 0-9 - _
											</p>
											{newTagError && (
												<p className="font-medium text-[11px] text-red-500">
													{newTagError}
												</p>
											)}
										</div>
									)}
								</div>

								<div className="mt-2 flex items-center justify-between gap-3">
									<div className="flex flex-col text-[10px] text-gray-500">
										<span>
											Created:{" "}
											{new Date(editingPrompt.createdAt).toLocaleString()}
										</span>
										{editingPrompt.updatedAt && (
											<span>
												Updated:{" "}
												{new Date(editingPrompt.updatedAt).toLocaleString()}
											</span>
										)}
									</div>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={closeEdit}
											className="rounded-md border border-gray-300 bg-white-1 px-4 py-2 font-medium text-xs transition-colors hover:bg-gray-100"
											disabled={isSubmitting}
										>
											Cancel
										</button>
										<button
											type="submit"
											disabled={isSubmitting || !isDirty}
											className="rounded-md bg-black-1 px-5 py-2 font-medium text-white text-xs transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
										>
											{isSubmitting ? "Saving..." : "Save Changes"}
										</button>
									</div>
								</div>
							</form>

							<p className="mt-4 text-[11px] text-gray-4">
								Tip: Escape to close. Enter will save if the form is valid.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Dashboard;
