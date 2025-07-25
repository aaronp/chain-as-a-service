import { type ClassValue, clsx } from "clsx"
import { BytesLike } from "ethers";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function bytecodeToBase64(bytecode: BytesLike): string {
    if (typeof bytecode === 'string') {
        return bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;
    } else if (bytecode instanceof Uint8Array) {
        return Buffer.from(bytecode).toString('hex');
    } else {
        throw new Error('Unsupported bytecode type');
    }
} 