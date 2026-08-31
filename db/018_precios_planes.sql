-- ---------------------------------------------------------------------
--  Precios definitivos de los planes.
--
--  La base del calculo es comercial, no tecnica: el plan mensual vale
--  35.000 por 700 intervenciones, o sea 50 pesos cada una, sobre un
--  costo interno de 25 -- el doble. Los planes largos entregan ese
--  mismo precio con descuento por pago adelantado:
--
--    mensual     35.000   700/mes   50,00 por intervencion
--    6 meses    189.000   700/mes   45,00   (10% de descuento)
--    anual      352.800   700/mes   42,00   (16% de descuento)
--
--  Las intervenciones siguen entregandose MES A MES y no todas de
--  golpe. Es la misma promesa para el alumno -- 700 cada mes -- y
--  evita que alguien pague un ano, consuma las 8.400 en enero y
--  dispare el costo de un solo tiron.
--
--  El descuento no se guarda: la pantalla lo calcula contra el precio
--  mensual, asi nunca puede quedar un porcentaje mintiendo sobre un
--  precio que cambio.
-- ---------------------------------------------------------------------

update planes set precio_cop =  35000, mensajes_por_mes = 700 where codigo = 'mensual';
update planes set precio_cop = 189000, mensajes_por_mes = 700 where codigo = 'semestral';
update planes set precio_cop = 352800, mensajes_por_mes = 700 where codigo = 'anual';
