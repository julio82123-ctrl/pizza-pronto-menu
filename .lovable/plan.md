# Corrigir pedidos que não são salvos

## O que está acontecendo

O pedido realmente não é gravado, mas a tela de sucesso aparece de qualquer forma.

Duas coisas se somam:

1. Ao confirmar o pedido, o servidor consulta o cardápio com o nome errado: procura por "Pizzas" (com P maiúsculo), mas a tabela se chama "pizzas". A consulta falha e o pedido nunca chega a ser inserido. Há um commit recente com essa alteração — antes dela os pedidos eram salvos (existem 4 pedidos de 13/09 na tabela; nenhum depois disso).
2. Quando o servidor falha, o erro é convertido numa página de erro genérica que o formulário do checkout não reconhece como falha. Por isso ele limpa o carrinho e mostra "Pedido recebido!" mesmo tendo dado erro.

## Correção

1. Voltar a consulta do cardápio para o nome real da tabela (`pizzas`) na gravação do pedido.
2. Fazer o checkout confirmar de verdade: só mostrar "Pedido recebido!" quando o servidor devolver a confirmação do pedido; caso contrário exibir a mensagem de erro e manter o carrinho intacto.
3. Testar de ponta a ponta no navegador (adicionar pizza, finalizar pedido) e conferir que o novo pedido aparece na tabela e no painel do dono.

## Detalhes técnicos

- `src/lib/pedidos.functions.ts`: `.from("Pizzas")` → `.from("pizzas")`.
- `criarPedido` passa a retornar `{ id, total }` (o insert precisa de `.select("id")`; hoje anon só tem INSERT, então o retorno virá de uma política/abordagem que não exponha outros pedidos — alternativa: manter o insert sem select e validar a resposta pelo shape `{ total }` retornado, tratando qualquer resposta inesperada como erro).
- `src/routes/checkout.tsx`: validar o retorno de `enviarPedido` antes de `clearCart()`/`setSucesso(true)`; qualquer resposta não-esperada (inclusive HTML de erro) cai no bloco de erro.
- Verificação: `bunx tsgo --noEmit` + script Playwright em `/tmp/browser/pedido/` e conferência da tabela `pedidos`.
