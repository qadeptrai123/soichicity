import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export interface PasswordInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false)
        const hasValue = props.value && String(props.value).length > 0;

        return (
            <div className="relative">
                <Input
                    type={showPassword ? "text" : "password"}
                    className={cn(
                        "pr-10",
                        "[&::-ms-reveal]:hidden [&::-ms-clear]:hidden", // Hide Edge/IE native button
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {hasValue && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                        </span>
                    </button>
                )}
            </div>
        )
    }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
