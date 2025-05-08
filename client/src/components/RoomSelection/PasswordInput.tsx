import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input, type InputProps } from "../../components/ui/input";
import { cn } from "../../lib/utils";

const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, setAlert, alert, setPassword, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false);
        const disabled =
            props.value === "" || props.value === undefined || props.disabled;

        return (
            <div className="relative">
                <Input
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    className={cn("hide-password-toggle pr-10", className)}
                    ref={ref}
                    onChange={(e) => {
                        if (e.target.value.endsWith(" ")) {
                            setAlert("Spaces are not allowed in password");
                            return;
                        } else if (alert && !e.target.value.endsWith(" ")) {
                            setAlert(null);
                        }
                        setPassword(e.target.value);
                    }}
                    {...props}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute cursor-pointer right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={disabled}
                >
                    {showPassword && !disabled ? (
                        <EyeIcon className="h-4 w-4" aria-hidden="true" />
                    ) : (
                        <EyeOffIcon className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                    </span>
                </Button>
            </div>
        );
    }
);

export { PasswordInput };
