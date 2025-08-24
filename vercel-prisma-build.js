import fs from 'fs';
import path from 'path';
import { nodeFileTrace } from '@vercel/nft';

async function main() {
    // ✅ 1. Cria um .npmrc temporário com o token de ambiente
    const token = process.env.GITHUB_PACKAGES_TOKEN;
    if (!token) {
        console.error('❌ GITHUB_PACKAGES_TOKEN não definido no ambiente!');
        process.exit(1);
    }

    const npmrcContent = `
@gabrielmbatista:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${token}
`;

    fs.writeFileSync('.npmrc', npmrcContent.trim());
    console.log('✅ .npmrc criado com sucesso');

    // ✅ 2. Prisma: inclui dependências do @prisma/client no .next/standalone
    const { fileList } = await nodeFileTrace(['node_modules/@prisma/client/index.js']);
    for (const file of fileList) {
        const src = path.resolve(file);
        const dest = path.resolve('.next/standalone', file);
        if (fs.existsSync(src)) {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(src, dest);
        }
    }

    console.log('✅ Prisma files copiados para .next/standalone');

    // ✅ 3. Remove .npmrc temporário após o build (opcional)
    if (fs.existsSync('.npmrc')) {
        fs.unlinkSync('.npmrc');
        console.log('✅ .npmrc removido após o build');
    }
}

main();
