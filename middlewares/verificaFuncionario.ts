import { Request, Response, NextFunction } from "express"
import jwt from 'jsonwebtoken'

interface TokenPayload {
    usuarioLogadoId: string;
    usuarioLogadoNome: string;
    usuarioLogadoTipo: 'CLIENTE' | 'FUNCIONARIO';
}

export const verificaFuncionario = (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers

    if (!authorization) {
        return res.status(401).json({ erro: "Token não fornecido" })
    }

    const [, token] = authorization.split(" ")

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY as string)
        const { usuarioLogadoTipo } = decoded as TokenPayload

        if (usuarioLogadoTipo !== 'FUNCIONARIO') {
            return res.status(403).json({ erro: "Acesso negado: rota exclusiva para funcionários." })
        }

        return next()

    } catch (error) {
        return res.status(401).json({ erro: "Token inválido ou expirado" })
    }
}