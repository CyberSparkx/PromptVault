import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

type FormValues = {
	title: string;
	prompt: string;
	tag: string;
	isCommunity: boolean;
};

export type PromptItem = {
	id: string;
	title: string;
	prompt: string;
	tag: string;
	isCommunity: boolean;
	createdAt: string; // ISO
	updatedAt?: string; // ISO
};

const LS_PROMPTS_KEY = "prompt_vault_prompts";
const LS_TAGS_KEY = "prompt_vault_tags";

const API_ROOT: string =
	(import.meta as any).env?.VITE_API_ROOT ||
	((import.meta as any).env?.VITE_API_BASE_URL
		? (import.meta as any).env.VITE_API_BASE_URL.replace(/\/auth\/?$/, "")
		: "");

const Home = () => {
	const [tags, setTags] = useState<string[]>(["AI", "Frontend", "React"]);
	const [prompts, setPrompts] = useState<PromptItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string>("");
	const [showAddTagModal, setShowAddTagModal] = useState(false);
	const [newTag, setNewTag] = useState("");
	const [tagError, setTagError] = useState("");
	const newTagInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		try {
			const storedPrompts = localStorage.getItem(LS_PROMPTS_KEY);
			const storedTags = localStorage.getItem(LS_TAGS_KEY);

			if (storedPrompts) {
				const parsed: PromptItem[] = JSON.parse(storedPrompts).map(
					(p: any) => ({
						...p,
						createdAt: p.createdAt || new Date().toISOString(),
					}),
				);
				setPrompts(parsed);
			}

			if (storedTags) {
				const parsedTags: string[] = JSON.parse(storedTags);
				setTags((prev) =>
					Array.from(new Set([...prev, ...parsedTags])).sort((a, b) =>
						a.localeCompare(b),
					),
				);
			}
		} catch (e) {
			console.warn("Failed to parse stored data", e);
		}
	}, []);

	useEffect(() => {
		const fetchPrompts = async () => {
			if (!API_ROOT) {
				console.warn("API root not configured. Set VITE_API_ROOT.");
				return;
			}
			setLoading(true);
			setError("");
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

				const mapped: PromptItem[] = serverPrompts.map((p: any) => ({
					id: p._id || nanoid(),
					title: p.title,
					prompt: p.prompt,
					tag: Array.isArray(p.tags) && p.tags.length ? String(p.tags[0]) : "",
					isCommunity: Boolean(p.isCommunity),
					createdAt: p.date
						? new Date(p.date).toISOString()
						: new Date().toISOString(),
				}));

				setPrompts(mapped);
			} catch (e: any) {
				setError(e?.message || "Could not fetch prompts");
			} finally {
				setLoading(false);
			}
		};

		fetchPrompts();
	}, []);

	useEffect(() => {
		localStorage.setItem(LS_PROMPTS_KEY, JSON.stringify(prompts));
	}, [prompts]);

	useEffect(() => {
		localStorage.setItem(LS_TAGS_KEY, JSON.stringify(tags));
	}, [tags]);

	useEffect(() => {
		if (showAddTagModal && newTagInputRef.current) {
			setTimeout(() => newTagInputRef.current?.focus(), 10);
		}
	}, [showAddTagModal]);

	const {
		register,
		handleSubmit,
		setValue,
		reset,
		formState: { errors },
		watch,
	} = useForm<FormValues>({
		defaultValues: {
			isCommunity: false,
		},
	});

	const sanitizeTag = (raw: string) => {
		let cleaned = raw.replace(/\s+/g, "");
		cleaned = cleaned.replace(/[^a-zA-Z0-9-_]/g, "");
		return cleaned;
	};

	const handleNewTagChange = (val: string) => {
		const cleaned = sanitizeTag(val);
		setNewTag(cleaned);
		if (!cleaned) {
			setTagError("Tag cannot be empty or contain spaces.");
		} else if (tags.includes(cleaned)) {
			setTagError("Tag already exists.");
		} else {
			setTagError("");
		}
	};

	const handleAddTag = () => {
		const trimmed = newTag.trim();
		if (!trimmed || tagError) return;
		if (!tags.includes(trimmed)) {
			setTags((prev) => [...prev, trimmed]);
			setValue("tag", trimmed);
		} else {
			setValue("tag", trimmed);
		}
		setNewTag("");
		setTagError("");
		setShowAddTagModal(false);
	};

	const closeModal = () => {
		setShowAddTagModal(false);
		setNewTag("");
		setTagError("");
	};

	const submitHandler: SubmitHandler<FormValues> = async (data) => {
		setError("");
		if (!API_ROOT) {
			setError("API root not configured. Set VITE_API_ROOT.");
			return;
		}
		try {
			setSaving(true);

			const body = {
				title: data.title.trim(),
				prompt: data.prompt.trim(),
				tags: data.tag ? [sanitizeTag(data.tag)] : [],
				isCommunity: !!data.isCommunity,
			};

			const res = await fetch(`${API_ROOT}/prompts`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(body),
			});

			if (res.status === 401) {
				window.location.href = "/login";
				return;
			}

			if (!res.ok) {
				const resp = await safeJson(res);
				throw new Error(resp?.message || "Failed to create prompt");
			}

			const resp = await res.json();
			const p = resp?.prompt;

			const newPrompt: PromptItem = {
				id: p?._id || nanoid(),
				title: p?.title || body.title,
				prompt: p?.prompt || body.prompt,
				tag:
					(Array.isArray(p?.tags) && p.tags.length ? String(p.tags[0]) : "") ||
					body.tags?.[0] ||
					"",
				isCommunity: Boolean(p?.isCommunity ?? body.isCommunity),
				createdAt: p?.date
					? new Date(p.date).toISOString()
					: new Date().toISOString(),
			};

			setPrompts((prev) => [newPrompt, ...prev]);
			reset({
				title: "",
				prompt: "",
				tag: "",
				isCommunity: false,
			});
		} catch (e: any) {
			setError(e?.message || "Something went wrong");
		} finally {
			setSaving(false);
		}
	};

	const isCommunity = watch("isCommunity");

	return (
		<div className="flex h-dvh flex-1 bg-white-2">
			<div className="mx-auto flex w-1/2 flex-col items-center gap-5 pt-50">
				<div className="flex items-center gap-3">
					<img src="./logo-dark.svg" alt="logo" className="h-15" />
					<h1 className="font-normal text-5xl tracking-tight">Prompt Vault</h1>
				</div>

				<form
					className="relative m-10 flex w-full flex-col gap-2 rounded-md border border-gray-2 bg-gray-1 p-3 focus-within:border-gray-3"
					onSubmit={handleSubmit(submitHandler)}
				>
					<div className="relative w-full">
						<input
							type="text"
							{...register("title", {
								required: "Title cannot be empty",
								validate: (value) =>
									value.trim() !== "" || "Title cannot be empty",
							})}
							placeholder={
								errors.title ? `${errors.title.message}` : "Enter prompt title"
							}
							className={`w-full rounded-md text-xl outline-none ${
								errors.title ? "placeholder-red-500" : ""
							}`}
							aria-invalid={errors.title ? "true" : "false"}
						/>
						{errors.title && (
							<span className="-translate-y-1/2 absolute top-1/2 right-3 text-red-500">
								<i className="ri-error-warning-line" />
							</span>
						)}
					</div>

					<div className="relative w-full">
						<textarea
							className={`h-40 w-full resize-none rounded-md font-mono text-md outline-none ${
								errors.prompt ? "placeholder-red-500" : ""
							}`}
							{...register("prompt", {
								required: "Prompt cannot be empty",
								validate: (value) =>
									value.trim() !== "" || "Textarea cannot be empty",
							})}
							placeholder={
								errors.prompt
									? `${errors.prompt.message}`
									: "Add your prompt here"
							}
						/>
						{errors.prompt && (
							<span className="absolute top-4 right-3 text-red-500">
								<i className="ri-error-warning-line" />
							</span>
						)}
					</div>

					<div className="flex w-full flex-wrap items-end justify-between gap-4">
						<label
							className="flex cursor-pointer select-none items-center gap-2 font-medium text-xs"
							title="Mark this prompt as community / public"
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
									isCommunity ? "text-black-1" : "text-gray-500"
								}`}
							>
								Community
							</span>
						</label>

						<div className="flex gap-4">
							<div className="flex flex-col gap-3">
								<select
									{...register("tag")}
									onChange={(e) => {
										if (e.target.value === "__add_new__") {
											setShowAddTagModal(true);
											setValue("tag", "");
										}
									}}
									className="h-full rounded-md border border-gray-2 bg-white px-2 py-2 text-sm hover:cursor-pointer"
									defaultValue=""
								>
									<option value="">None</option>
									{tags.map((tag) => (
										<option key={tag} value={tag}>
											{tag}
										</option>
									))}
									<option value="__add_new__">Add new tag</option>
								</select>
							</div>

							<button
								type="submit"
								disabled={saving}
								className="rounded-md bg-black-1 px-4 py-2 text-sm text-white-1 shadow-sm transition-colors hover:cursor-pointer hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
							>
								{saving ? "Saving..." : "Save prompt"}
							</button>
							<button
								type="reset"
								onClick={() =>
									reset({
										title: "",
										prompt: "",
										tag: "",
										isCommunity: false,
									})
								}
								className="rounded-md border border-gray-3 bg-gray-2 px-4 py-2 text-black-1 text-sm shadow-sm transition-colors hover:cursor-pointer hover:border-gray-4 hover:bg-gray-3"
							>
								Reset
							</button>
						</div>
					</div>

					{error && (
						<div className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-600 text-sm">
							{error}
						</div>
					)}
				</form>

				<div className="flex w-full flex-col gap-2">
					<h1 className="flex items-center justify-between text-xl">
						<span>Recently added prompts</span>
						{prompts.length > 4 && (
							<a
								href="/dashboard"
								className="text-blue-600 text-sm hover:underline"
							>
								View all
							</a>
						)}
					</h1>

					<div className="flex flex-wrap justify-between gap-4">
						{loading ? (
							<p className="text-gray-4 text-sm">Loading...</p>
						) : prompts.length > 0 ? (
							prompts.slice(0, 4).map((item) => (
								<div
									key={item.id}
									className="flex h-30 w-[49%] flex-col gap-2 overflow-hidden rounded-md border border-gray-2 bg-gray-1 p-3"
								>
									<div className="flex items-center justify-between">
										<h2 className="line-clamp-2 font-medium">{item.title}</h2>
									</div>
									<p className="scrollbar-hide flex-1 overflow-scroll font-mono text-xs">
										{item.prompt}
									</p>
									<div className="flex items-center gap-2">
										{item.isCommunity && (
											<span className="rounded-full bg-black-1 px-2 py-0.5 font-semibold text-[10px] text-white uppercase tracking-wide">
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
						) : (
							<p className="text-gray-4 text-sm">No prompts yet.</p>
						)}
					</div>
				</div>
			</div>

			{showAddTagModal && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center"
					role="dialog"
					aria-modal="true"
					aria-labelledby="add-tag-title"
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							e.preventDefault();
							closeModal();
						}
					}}
				>
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
						onClick={closeModal}
					/>
					<div className="relative z-10 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-5 shadow-lg">
						<h2
							id="add-tag-title"
							className="mb-3 font-semibold text-lg tracking-tight"
						>
							Add a new tag
						</h2>
						<div className="flex flex-col gap-2">
							<input
								ref={newTagInputRef}
								type="text"
								value={newTag}
								onChange={(e) => handleNewTagChange(e.target.value)}
								placeholder="e.g. productivity"
								className={`rounded-md border px-3 py-2 text-sm outline-none transition-colors ${
									tagError
										? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
										: "border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-400"
								}`}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddTag();
									}
								}}
							/>
							<div className="flex items-center justify-between">
								<p className="text-[11px] text-gray-500">
									No spaces. Allowed: a-z 0-9 - _
								</p>
							</div>
							{tagError && (
								<p className="font-medium text-[11px] text-red-500">
									{tagError}
								</p>
							)}
							<div className="mt-1 flex justify-end gap-2">
								<button
									type="button"
									onClick={closeModal}
									className="rounded-md border border-gray-300 px-3 py-2 font-medium text-xs transition-colors hover:bg-gray-100"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleAddTag}
									disabled={!!tagError || !newTag.trim()}
									className="rounded-md bg-black-1 px-3 py-2 font-medium text-white text-xs transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
								>
									Add Tag
								</button>
							</div>
							<p className="text-[11px] text-gray-500">
								Press Enter to add, Escape to cancel.
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Home;

async function safeJson(res: Response) {
	try {
		return await res.json();
	} catch {
		return null;
	}
}
