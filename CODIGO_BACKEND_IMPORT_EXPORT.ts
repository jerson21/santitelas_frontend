// ===================================================================
// CÓDIGO PARA AGREGAR AL ARCHIVO:
// backend_santitelas/santitelas-api/src/routes/productos-admin.routes.ts
//
// AGREGAR ANTES DE: export default router;
// ===================================================================

// ===========================
// 📤 EXPORTAR PRODUCTOS A EXCEL
// ===========================
router.get('/exportar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoria, tipo, template } = req.query;
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();

    // Si es template, generar archivo vacío con headers
    if (template === 'true') {
      const sheetDetalle = workbook.addWorksheet('Detalle_Completo');
      sheetDetalle.columns = [
        { header: 'codigo_producto', key: 'codigo_producto', width: 15 },
        { header: 'modelo', key: 'modelo', width: 25 },
        { header: 'categoria', key: 'categoria', width: 15 },
        { header: 'tipo', key: 'tipo', width: 15 },
        { header: 'unidad_medida', key: 'unidad_medida', width: 15 },
        { header: 'color', key: 'color', width: 15 },
        { header: 'medida', key: 'medida', width: 10 },
        { header: 'material', key: 'material', width: 20 },
        { header: 'modalidad', key: 'modalidad', width: 15 },
        { header: 'cantidad_base', key: 'cantidad_base', width: 12 },
        { header: 'precio_neto', key: 'precio_neto', width: 12 },
        { header: 'es_variable', key: 'es_variable', width: 10 },
        { header: 'minimo_cantidad', key: 'minimo_cantidad', width: 15 },
        { header: 'afecto_descuento', key: 'afecto_descuento', width: 15 }
      ];

      sheetDetalle.getRow(1).font = { bold: true };
      sheetDetalle.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_productos.xlsx');
      await workbook.xlsx.write(res);
      return res.end();
    }

    // Exportación con datos
    const whereProducto: any = { activo: true };
    if (categoria) whereProducto['$categoria.nombre$'] = categoria;
    if (tipo) whereProducto.tipo = tipo;

    const productos = await Producto.findAll({
      where: whereProducto,
      include: [
        { model: Categoria, as: 'categoria', attributes: ['nombre'] },
        {
          model: VarianteProducto, as: 'variantes', where: { activo: true }, required: false,
          include: [
            { model: ModalidadProducto, as: 'modalidades', where: { activa: true }, required: false },
            { model: StockPorBodega, as: 'stockPorBodega', required: false }
          ]
        }
      ],
      order: [['codigo', 'ASC']]
    });

    const sheetDetalle = workbook.addWorksheet('Detalle_Completo');
    sheetDetalle.columns = [
      { header: 'codigo_producto', key: 'codigo_producto', width: 15 },
      { header: 'modelo', key: 'modelo', width: 25 },
      { header: 'categoria', key: 'categoria', width: 15 },
      { header: 'tipo', key: 'tipo', width: 15 },
      { header: 'unidad_medida', key: 'unidad_medida', width: 15 },
      { header: 'color', key: 'color', width: 15 },
      { header: 'medida', key: 'medida', width: 10 },
      { header: 'material', key: 'material', width: 20 },
      { header: 'modalidad', key: 'modalidad', width: 15 },
      { header: 'cantidad_base', key: 'cantidad_base', width: 12 },
      { header: 'precio_neto', key: 'precio_neto', width: 12 },
      { header: 'es_variable', key: 'es_variable', width: 10 },
      { header: 'minimo_cantidad', key: 'minimo_cantidad', width: 15 },
      { header: 'afecto_descuento', key: 'afecto_descuento', width: 15 }
    ];

    productos.forEach((producto: any) => {
      producto.variantes?.forEach((variante: any) => {
        variante.modalidades?.forEach((modalidad: any) => {
          sheetDetalle.addRow({
            codigo_producto: producto.codigo,
            modelo: producto.nombre,
            categoria: producto.categoria?.nombre,
            tipo: producto.tipo,
            unidad_medida: producto.unidad_medida,
            color: variante.color,
            medida: variante.medida,
            material: variante.material,
            modalidad: modalidad.nombre,
            cantidad_base: modalidad.cantidad_base,
            precio_neto: modalidad.precio_neto,
            es_variable: modalidad.es_cantidad_variable ? 'SI' : 'NO',
            minimo_cantidad: modalidad.minimo_cantidad,
            afecto_descuento: modalidad.afecto_descuento_ticket ? 'SI' : 'NO'
          });
        });
      });
    });

    sheetDetalle.getRow(1).font = { bold: true };
    sheetDetalle.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    const fecha = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=productos_${fecha}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

// ===========================
// 📥 IMPORTAR PRODUCTOS
// ===========================
router.post('/importar', async (req: Request, res: Response, next: NextFunction) => {
  const multer = require('multer');
  const upload = multer({ storage: multer.memoryStorage() });

  upload.single('file')(req, res, async (err: any) => {
    if (err) return res.status(400).json({ success: false, message: 'Error al subir archivo' });

    const transaction = await sequelize.transaction();
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió archivo' });

      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const sheet = workbook.getWorksheet('Detalle_Completo') || workbook.getWorksheet(1);
      if (!sheet) return res.status(400).json({ success: false, message: 'Archivo sin datos' });

      const productosMap = new Map();
      let errores: string[] = [];

      sheet.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
        if (rowNumber === 1) return; // Skip header

        const codigo = row.getCell(1).value;
        const modelo = row.getCell(2).value;
        const categoria = row.getCell(3).value;
        const tipo = row.getCell(4).value;
        const unidad_medida = row.getCell(5).value;
        const color = row.getCell(6).value;
        const medida = row.getCell(7).value;
        const material = row.getCell(8).value;
        const modalidad = row.getCell(9).value;
        const cantidad_base = row.getCell(10).value;
        const precio_neto = row.getCell(11).value;
        const es_variable = row.getCell(12).value;
        const minimo_cantidad = row.getCell(13).value;
        const afecto_descuento = row.getCell(14).value;

        if (!codigo || !modelo || !categoria) {
          errores.push(`Línea ${rowNumber}: Faltan campos obligatorios (codigo, modelo, categoria)`);
          return;
        }

        // Agrupar por producto
        if (!productosMap.has(codigo)) {
          productosMap.set(codigo, {
            codigo, nombre: modelo, categoria, tipo,
            unidad_medida: unidad_medida || 'unidad',
            variantes: new Map()
          });
        }

        const producto = productosMap.get(codigo);
        const varianteKey = `${color}-${medida}-${material}`;

        if (!producto.variantes.has(varianteKey)) {
          producto.variantes.set(varianteKey, { color, medida, material, modalidades: [] });
        }

        producto.variantes.get(varianteKey).modalidades.push({
          nombre: modalidad,
          cantidad_base: Number(cantidad_base) || 1,
          precio_neto: Number(precio_neto) || 0,
          precio_neto_factura: Math.round(Number(precio_neto) * 1.19),
          es_cantidad_variable: es_variable === 'SI',
          minimo_cantidad: Number(minimo_cantidad) || 1,
          afecto_descuento_ticket: afecto_descuento === 'SI'
        });
      });

      if (errores.length > 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Errores en el archivo', errores: errores.slice(0, 10) });
      }

      let importados = 0, actualizados = 0;

      for (const [codigo, productoData] of productosMap) {
        const cat = await Categoria.findOne({ where: { nombre: productoData.categoria } });
        if (!cat) {
          console.warn(`Categoría "${productoData.categoria}" no existe, saltando producto ${codigo}`);
          continue;
        }

        let producto = await Producto.findOne({ where: { codigo } });

        if (producto) {
          // Actualizar producto existente
          await producto.update({
            nombre: productoData.nombre,
            tipo: productoData.tipo,
            unidad_medida: productoData.unidad_medida
          }, { transaction });
          actualizados++;
        } else {
          // Crear nuevo producto
          producto = await Producto.create({
            codigo, nombre: productoData.nombre, id_categoria: cat.id_categoria,
            tipo: productoData.tipo, unidad_medida: productoData.unidad_medida, activo: true
          }, { transaction });
          importados++;
        }

        // Crear variantes y modalidades
        for (const [, varianteData] of productoData.variantes) {
          // Generar SKU único
          let sku = `${codigo}-${varianteData.color || 'STD'}`.substring(0, 50);
          let contador = 1;

          while (await VarianteProducto.findOne({ where: { sku } })) {
            sku = `${codigo}-${varianteData.color || 'STD'}-${contador}`.substring(0, 50);
            contador++;
          }

          const variante = await VarianteProducto.create({
            id_producto: producto.id_producto, sku,
            color: varianteData.color, medida: varianteData.medida,
            material: varianteData.material, activo: true
          }, { transaction });

          // Crear modalidades
          for (const modalidadData of varianteData.modalidades) {
            await ModalidadProducto.create({
              id_variante_producto: variante.id_variante_producto,
              ...modalidadData, activa: true
            }, { transaction });
          }
        }
      }

      await transaction.commit();
      res.status(201).json({
        success: true,
        data: { importados, actualizados, total: importados + actualizados },
        message: `Importación exitosa: ${importados} productos nuevos, ${actualizados} actualizados`
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  });
});
