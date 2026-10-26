# Sobre el loop

Demo para grabar en YouTube, desde QA, el SDLC nativo de IA del playbook de Anthropic. Un incidente de checkout —la cache key pierde el `tenant id` y la tasa de 5xx sale de banda— recorre seis beats. No hay llamadas a un modelo: el detector de bandas, el test de la cache y el hook de producción corren en el browser.

## Correrla

```bash
npm install
npm test
npm run dev
```

Abrí [http://127.0.0.1:43123](http://127.0.0.1:43123).

`npm test` corre Vitest sobre el detector, el cruce de tenants y la compuerta. Esos mismos módulos alimentan los botones **Correr**.

## En pantalla

| Beat | Qué mostrar |
| --- | --- |
| 01 Cuello | El build colapsa a horas. Test, deploy y maintain siguen largos. |
| 02 Alerta | **Correr detector.** 3σ propone. 1σ solo registra. |
| 03 Expediente | `intent.md` al lado de `spec.md`. Cerrá inventario y aceptá el par, o devolvilo. |
| 04 Prueba | Test rojo, el hook frena la edición del test, la key corregida pasa con el mismo sello. |
| 05 Compuerta | Important contra nit. El hook bloquea `deploy production` hasta la firma del release manager. |
| 06 Cierre | La serie vuelve a banda. Triage: arreglar ahora, programar o descartar. El eval queda. |

Controles: **← →** cambian de beat, **G** o **Grabar** agranda el tipo y esconde la nota técnica. En el beat 04 el orden es fijo: primero el test rojo, después el intento de editarlo, después la key.

## Guion de toma, 6 a 8 minutos

1. **Antes de grabar.** Apretá Grabar. Presentate como QA. El caso es el 5xx de checkout después del deploy de las 21:40.
2. **01.** Señalá las dos filas. El tiempo que vuelve sale del build. QA queda en Test, que no se acortó.
3. **02.** Mostrá la rampa roja. Corré el detector y leé la regla en voz alta. Aclará que la detección es determinista: el agente entra después.
4. **03.** Leé el problema en `intent.md` y la policy en `spec.md`. Marcá inventario como fuera de este cambio y aceptá el par. El sello es la decisión.
5. **04.** Este es el centro del video. Corré el test rojo: espera 200 y obtiene 500 con la key `cable-hdmi`. Dejá que el agente edite el test: exit 2, el sello no se mueve. Corregí la key: el test pasa y el sello sigue igual. Recién ahí aparece el eval.
6. **05.** Pasá por el hallazgo Important (el precio del otro tenant en el log) y por el nit. Corré el hook sin firma: exit 2. Firmá como release manager —no es el rol de QA— y corré de nuevo. El comando pasa. El code owner sigue siendo una persona.
7. **06.** Corré el detector sobre la serie del rollback: en banda. Elegí arreglar ahora. Cerrá con una frase: QA deja de ser la compuerta del final del release y se queda arriba del loop.

Si algo no cabe en plano, el escenario scrollea dentro del beat. En Grabar, el texto de apoyo desaparece a propósito para que la voz en off no compita con un párrafo.
