import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

type Props = { mode: "login" | "signup" };

type LoginValues = {
	identifier: string;
	password: string;
};

type SignupValues = {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export default function Auth({ mode }: Props) {
	const isLogin = mode === "login";
	const [loading, setLoading] = useState(false);
	const [serverErr, setServerErr] = useState<string>("");
	const [showPwd, setShowPwd] = useState(false);
	const [showConfirmPwd, setShowConfirmPwd] = useState(false);

	const {
		register,
		handleSubmit,
		watch,
		reset,
		formState: { errors },
		setError,
	} = useForm<LoginValues & SignupValues>({
		defaultValues: {
			identifier: "",
			username: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	const password = watch("password");
	const confirmPassword = watch("confirmPassword");

	useEffect(() => {
		if (!isLogin) return;
		const checkSession = async () => {
			try {
				if (!API_BASE) return;
				const res = await fetch(`${API_BASE}/login`, {
					method: "GET",
					credentials: "include",
				});
				if (res.ok) {
					window.location.href = "/dashboard";
				}
			} catch {
				// ignore
			}
		};
		checkSession();
	}, [isLogin]);

	useEffect(() => {
		if (!isLogin && confirmPassword && password !== confirmPassword) {
			setError("confirmPassword", {
				type: "validate",
				message: "Passwords do not match",
			});
		}
	}, [confirmPassword, password, isLogin, setError]);

	const title = useMemo(
		() => (isLogin ? "Login" : "Create account"),
		[isLogin],
	);
	const subTitle = useMemo(
		() => (isLogin ? "Welcome back" : "Join Prompt Vault"),
		[isLogin],
	);
	const submitLabel = useMemo(
		() => (isLogin ? "Log in" : "Sign up"),
		[isLogin],
	);

	const onSubmit = async (values: LoginValues & SignupValues) => {
		try {
			setServerErr("");
			setLoading(true);

			if (!API_BASE) {
				setServerErr("API base URL not configured. Set VITE_API_BASE_URL.");
				return;
			}

			if (isLogin) {
				const { identifier, password } = values;
				if (!identifier || !password) {
					setServerErr("Username/Email and password required");
					return;
				}
				const isEmail = identifier.includes("@");
				const payload: Record<string, string> = { password };
				if (isEmail) payload.email = identifier.trim();
				else payload.username = identifier.trim();

				const res = await fetch(`${API_BASE}/login`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify(payload),
				});

				if (!res.ok) {
					const data = await safeJson(res);
					throw new Error(data?.message || "Login failed");
				}

				window.location.href = "/dashboard";
				return;
			}

			const { username, email, password, confirmPassword } = values;

			if (!username?.trim() || !email?.trim() || !password) {
				setServerErr("All fields are required");
				return;
			}
			if (password !== confirmPassword) {
				setError("confirmPassword", {
					type: "validate",
					message: "Passwords do not match",
				});
				return;
			}

			const res = await fetch(`${API_BASE}/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					username: username.trim(),
					email: email.trim(),
					password,
				}),
			});

			if (!res.ok) {
				const data = await safeJson(res);
				throw new Error(data?.message || "Registration failed");
			}

			reset();
			window.location.href = "/dashboard";
		} catch (err: any) {
			setServerErr(err?.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="flex h-dvh flex-1 bg-white-2">
			<div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 pt-40">
				<div className="flex items-center gap-3">
					<img src="/logo-dark.svg" alt="logo" className="h-15" />
					<div>
						<h1 className="font-normal text-4xl tracking-tight">{subTitle}</h1>
						<p className="text-gray-500 text-sm">{title} to continue</p>
					</div>
				</div>

				<form
					className="relative mt-6 flex w-full flex-col gap-3 rounded-md border border-gray-2 bg-gray-1 p-4 focus-within:border-gray-3"
					onSubmit={handleSubmit(onSubmit)}
					noValidate
				>
					{!isLogin && (
						<>
							<div className="relative w-full">
								<input
									type="text"
									{...register("username", {
										required: !isLogin ? "Username cannot be empty" : false,
										validate: (v) =>
											isLogin || v.trim() !== "" || "Username cannot be empty",
									})}
									placeholder={
										!isLogin && errors.username
											? String(errors.username.message)
											: "Username"
									}
									className={`w-full rounded-md text-xl outline-none ${
										!isLogin && errors.username ? "placeholder-red-500" : ""
									}`}
									aria-invalid={!isLogin && errors.username ? "true" : "false"}
								/>
								{!isLogin && errors.username && (
									<span className="-translate-y-1/2 absolute top-1/2 right-3 text-red-500">
										<i className="ri-error-warning-line" />
									</span>
								)}
							</div>

							<div className="relative w-full">
								<input
									type="email"
									{...register("email", {
										required: !isLogin ? "Email is required" : false,
										pattern: {
											value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
											message: "Invalid email address",
										},
									})}
									placeholder={
										!isLogin && errors.email
											? String(errors.email.message)
											: "Email"
									}
									className={`w-full rounded-md text-xl outline-none ${
										!isLogin && errors.email ? "placeholder-red-500" : ""
									}`}
									aria-invalid={!isLogin && errors.email ? "true" : "false"}
								/>
								{!isLogin && errors.email && (
									<span className="-translate-y-1/2 absolute top-1/2 right-3 text-red-500">
										<i className="ri-error-warning-line" />
									</span>
								)}
							</div>
						</>
					)}

					{isLogin && (
						<div className="relative w-full">
							<input
								type="text"
								{...register("identifier", {
									required: isLogin ? "Username/Email is required" : false,
									validate: (v) =>
										isLogin
											? v.trim() !== "" || "Identifier is required"
											: true,
								})}
								placeholder={
									isLogin && errors.identifier
										? String(errors.identifier.message)
										: "Username or Email"
								}
								className={`w-full rounded-md text-xl outline-none ${
									isLogin && errors.identifier ? "placeholder-red-500" : ""
								}`}
								aria-invalid={isLogin && errors.identifier ? "true" : "false"}
							/>
							{isLogin && errors.identifier && (
								<span className="-translate-y-1/2 absolute top-1/2 right-3 text-red-500">
									<i className="ri-error-warning-line" />
								</span>
							)}
						</div>
					)}

					<div className="relative w-full">
						<input
							type={showPwd ? "text" : "password"}
							{...register("password", {
								required: "Password cannot be empty",
								minLength: !isLogin
									? { value: 6, message: "Minimum 6 characters" }
									: undefined,
							})}
							placeholder={
								errors.password ? String(errors.password.message) : "Password"
							}
							className={`w-full rounded-md text-xl outline-none ${
								errors.password ? "placeholder-red-500" : ""
							}`}
							aria-invalid={errors.password ? "true" : "false"}
						/>
						<button
							type="button"
							onClick={() => setShowPwd((s) => !s)}
							className="-translate-y-1/2 absolute top-1/2 right-3 text-gray-600"
							tabIndex={-1}
							aria-label={showPwd ? "Hide password" : "Show password"}
						>
							<i className={showPwd ? "ri-eye-off-line" : "ri-eye-line"} />
						</button>
						{errors.password && (
							<span className="-translate-y-1/2 absolute top-1/2 right-9 text-red-500">
								<i className="ri-error-warning-line" />
							</span>
						)}
					</div>

					{!isLogin && (
						<div className="relative w-full">
							<input
								type={showConfirmPwd ? "text" : "password"}
								{...register("confirmPassword", {
									required: "Confirm your password",
									validate: (v) => v === password || "Passwords do not match",
								})}
								placeholder={
									errors.confirmPassword
										? String(errors.confirmPassword.message)
										: "Confirm password"
								}
								className={`w-full rounded-md text-xl outline-none ${
									errors.confirmPassword ? "placeholder-red-500" : ""
								}`}
								aria-invalid={errors.confirmPassword ? "true" : "false"}
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPwd((s) => !s)}
								className="-translate-y-1/2 absolute top-1/2 right-3 text-gray-600"
								tabIndex={-1}
								aria-label={showConfirmPwd ? "Hide password" : "Show password"}
							>
								<i
									className={showConfirmPwd ? "ri-eye-off-line" : "ri-eye-line"}
								/>
							</button>
							{errors.confirmPassword && (
								<span className="-translate-y-1/2 absolute top-1/2 right-9 text-red-500">
									<i className="ri-error-warning-line" />
								</span>
							)}
						</div>
					)}

					{serverErr && (
						<div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-600 text-sm">
							{serverErr}
						</div>
					)}

					<div className="mt-1 flex items-center justify-between">
						<button
							type="submit"
							disabled={loading}
							className="rounded-md bg-black-1 px-4 py-2 text-white-1 shadow-sm transition-colors hover:cursor-pointer hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
						>
							{loading ? "Please wait..." : submitLabel}
						</button>

						<div className="text-gray-600 text-sm">
							{isLogin ? (
								<span>
									New here?{" "}
									<a href="/signup" className="text-blue-600 hover:underline">
										Create an account
									</a>
								</span>
							) : (
								<span>
									Already have an account?{" "}
									<a href="/login" className="text-blue-600 hover:underline">
										Log in
									</a>
								</span>
							)}
						</div>
					</div>
				</form>
			</div>
		</section>
	);
}

async function safeJson(res: Response) {
	try {
		return await res.json();
	} catch {
		return null;
	}
}
