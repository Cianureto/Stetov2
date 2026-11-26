-- Registros: percentuais de cada nota (os tributos são editáveis por nota; o padrão vem do cliente)
-- e o % de desconto padrão do prestador no momento do lançamento.
alter table public.registros_financeiros
  add column aliquota_pis numeric(6,3) not null default 0,
  add column aliquota_cofins numeric(6,3) not null default 0,
  add column aliquota_csll numeric(6,3) not null default 0,
  add column aliquota_ir numeric(6,3) not null default 0,
  add column aliquota_iss numeric(6,3) not null default 0,
  add column desconto_padrao_percent numeric(6,3) not null default 0;
