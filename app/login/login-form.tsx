"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";

export function LoginForm() {
	const [state, formAction, isPending] = useActionState(loginAction, null);

	return (
		<form action={formAction} className="login-form">
			{state?.error && (
				<div className="login-error" role="alert">
					{state.error}
				</div>
			)}

			<div className="form-group">
				<label htmlFor="email" className="form-label">
					Email address
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					required
					placeholder="admin@greecechauffeur.com"
					className="form-input"
					disabled={isPending}
				/>
			</div>

			<div className="form-group">
				<label htmlFor="password" className="form-label">
					Password
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autoComplete="current-password"
					required
					placeholder="••••••••"
					className="form-input"
					disabled={isPending}
				/>
			</div>

			<button
				type="submit"
				className="btn btn-primary btn-full btn-lg"
				disabled={isPending}
			>
				{isPending ? "Signing in..." : "Sign In to Operations"}
			</button>
		</form>
	);
}
