import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ==========================================================
// --- UTILS / FUNÇÕES DE CÁLCULO ---
// ==========================================================

// Função para formatar valores monetários para o padrão Brasileiro (R$ 1.234,56)
const formatCurrency = (value) => `R$ ${Number(value).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

// Regras de comissão
const calculateCommission = (saleValue) => {
    if (saleValue < 100.00) return 0;
    if (saleValue < 500.00) return saleValue * 0.01;
    return saleValue * 0.05;
};

// ==========================================================
// --- COMPONENTE DO GRÁFICO DE BARRAS ---
// ==========================================================
const CommissionChart = React.memo(({ commissions }) => {
    const totalCommissionSum = Object.values(commissions).reduce((sum, current) => sum + current, 0);

    if (totalCommissionSum === 0) {
        return <p style={{ textAlign: 'center', color: '#777' }}>Não há comissões para gerar o gráfico.</p>;
    }

    const sellers = Object.keys(commissions).sort((a, b) => commissions[b] - commissions[a]);

    return (
        <div id="commissionChart">
            <h3 style={{ marginTop: '30px', color: 'var(--secondary-color)' }}>📊 Participação de Comissão (Gráfico)</h3>
            {sellers.map(seller => {
                const commissionValue = commissions[seller];
                const percentage = (commissionValue / totalCommissionSum) * 100;
                const barWidth = Math.min(percentage, 100).toFixed(2);

                return (
                    <div key={seller} className="chart-bar-container">
                        <div className="chart-label">{seller}</div>
                        <div className="chart-bar" style={{ width: `${barWidth}%` }}>
                            <span className="chart-bar-value">{barWidth.replace('.', ',')}%</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

// ==========================================================
// --- COMPONENTE DE SEÇÃO 1: COMISSÕES ---
// ==========================================================
const CommissionsSection = ({ salesData }) => {
    // Calcula as comissões por vendedor, memorizado para performance
    const commissionsBySeller = useMemo(() => {
        return salesData.vendas.reduce((acc, sale) => {
            const commission = calculateCommission(sale.valor);
            acc[sale.vendedor] = (acc[sale.vendedor] || 0) + commission;
            return acc;
        }, {});
    }, [salesData]);

    // Soma total das comissões, memorizado
    const totalCommissionSum = useMemo(() => {
        return Object.values(commissionsBySeller).reduce((sum, current) => sum + current, 0);
    }, [commissionsBySeller]);

    // Lista de vendedores, memorizada
    const sellers = useMemo(() => Object.keys(commissionsBySeller).sort((a, b) => commissionsBySeller[b] - commissionsBySeller[a]), [commissionsBySeller]);

    return (
        <section id="comissions-section">
            <h2>💵 1. Performance de Vendas (Comissão)</h2>
            <p className="rules-text">Regras: **&lt;R$100: 0%** | **R$100 a &lt;R$500: 1%** | **Igual ou Maior R$500: 5%**</p>
            <div id="comission-results">
                <table>
                    <thead>
                        <tr>
                            <th>Vendedor 🧑‍💼</th>
                            <th>Comissão Total 💲</th>
                            <th>Participação (%) 📊</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sellers.map(seller => {
                            const commissionValue = commissionsBySeller[seller];
                            const totalCommission = formatCurrency(commissionValue);
                            const percentage = totalCommissionSum > 0 ? (commissionValue / totalCommissionSum) * 100 : 0;
                            const formattedPercentage = percentage.toFixed(2).replace('.', ',') + '%';

                            return (
                                <tr key={seller}>
                                    <td>{seller}</td>
                                    <td>{totalCommission}</td>
                                    <td>{formattedPercentage}</td>
                                </tr>
                            );
                        })}
                        <tr className="total-row">
                            <td>TOTAL GERAL</td>
                            <td>{formatCurrency(totalCommissionSum)}</td>
                            <td>100,00%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <CommissionChart commissions={commissionsBySeller} />
        </section>
    );
};

// ==========================================================
// --- COMPONENTES MODAIS ---
// ==========================================================

// Modal genérico de Edição ou Confirmação
const EditModal = ({ product, onClose, onSave, isConfirmation = false, confirmAction, confirmMessage }) => {
    const [editData, setEditData] = useState(product || {});
    const [originalCode] = useState(product ? product.codigoProduto : null);

    useEffect(() => {
        if (product) {
            setEditData(product);
        }
    }, [product]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        let processedValue;

        if (id === 'edit-codigoProduto' || id === 'edit-estoque') {
            // Garante que o valor seja um número inteiro positivo
            processedValue = Math.max(0, parseInt(value) || 0);
        } else {
            processedValue = value;
        }
        
        setEditData(prev => ({ ...prev, [id.replace('edit-', '')]: processedValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(editData, originalCode);
    };

    if (isConfirmation) {
        return (
            <div className="modal-overlay">
                <div className="modal-content small-modal">
                    <div className="modal-header">
                        <h2>⚠️ Confirmar Ação</h2>
                        <button className="modal-close-btn" onClick={onClose}>&times;</button>
                    </div>
                    <p style={{ marginBottom: '20px' }}>{confirmMessage}</p>
                    <div className="modal-footer">
                        <button type="button" className="action-button btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="button" className="action-button btn-danger" onClick={confirmAction}>Confirmar Exclusão</button>
                    </div>
                </div>
            </div>
        );
    }

    // Modal de Edição de Produto
    if (!product) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>✏️ Editar Produto (Cód: {originalCode})</h2>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="edit-codigoProduto">Novo Código do Produto:</label>
                        <input type="number" id="edit-codigoProduto" value={editData.codigoProduto} onChange={handleChange} required min="1" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-descricaoProduto">Descrição:</label>
                        <input type="text" id="edit-descricaoProduto" value={editData.descricaoProduto} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-estoque">Estoque Atual:</label>
                        <input type="number" id="edit-estoque" min="0" value={editData.estoque} onChange={handleChange} required />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="action-button btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="action-button btn-primary">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ==========================================================
// --- COMPONENTE DE SEÇÃO 2: ESTOQUE ---
// ==========================================================
const StockSection = ({ initialStock }) => {
    // Define o estado inicial do produto selecionado ou vazio se não houver dados
    const [stock, setStock] = useState(initialStock.estoque);
    
    // Calcula o código inicial selecionado (garantindo que exista no estoque)
    const initialProductCode = useMemo(() => stock.length > 0 ? stock[0].codigoProduto : '', [stock]);

    const [movement, setMovement] = useState({
        productCode: initialProductCode,
        movementType: 'entrada',
        quantity: 10,
        description: 'Ajuste Padrão'
    });
    const [movementIdCounter, setMovementIdCounter] = useState(1);
    const [feedback, setFeedback] = useState({ type: 'success', message: '', display: false });
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null, // 'edit' or 'confirm'
        productData: null
    });

    const showFeedback = (type, message) => {
        setFeedback({ type, message, display: true });
        setTimeout(() => setFeedback(prev => ({ ...prev, display: false })), 5000);
    };

    const handleMovementChange = (e) => {
        const { id, value } = e.target;
        let processedValue = value;

        if (id === 'quantity') {
            // Garante que a quantidade seja um número inteiro positivo
            processedValue = Math.max(1, parseInt(value) || 1);
        } else if (id === 'productCode') {
            // Garante que o código do produto seja um número (ou string vazia se não for válido)
            processedValue = parseInt(value) || '';
        }

        setMovement(prev => ({ ...prev, [id]: processedValue }));
    };

    const performMovement = () => {
        const productCode = movement.productCode;
        const quantity = movement.quantity;

        if (isNaN(quantity) || quantity <= 0) {
            showFeedback('danger', 'Erro: A quantidade deve ser um número inteiro positivo.');
            return;
        }
        if (!productCode) {
            showFeedback('danger', 'Erro: Por favor, selecione um produto.');
            return;
        }

        const productIndex = stock.findIndex(p => p.codigoProduto === Number(productCode));
        if (productIndex === -1) {
            showFeedback('danger', `Erro: Produto com código ${productCode} não encontrado no estoque.`);
            return;
        }

        const currentMovementId = movementIdCounter;
        let newStock = [...stock];
        let product = newStock[productIndex];

        if (movement.movementType === 'entrada') {
            product.estoque += quantity;
        } else if (movement.movementType === 'saida') {
            if (product.estoque < quantity) {
                showFeedback('danger', `Erro ID ${currentMovementId}: Estoque insuficiente. Restam apenas **${product.estoque}** unidades.`);
                return;
            }
            product.estoque -= quantity;
        }

        setStock(newStock);
        setMovementIdCounter(prev => prev + 1);
        showFeedback('success', `ID **${currentMovementId}**: Movimento de **${movement.movementType.toUpperCase()}** - ${quantity} unidades. Estoque Final de "${product.descricaoProduto}": **${product.estoque}** unidades.`);
        setMovement(prev => ({ ...prev, quantity: 10, description: 'Ajuste Padrão' }));
    };

    // Função que será chamada após a confirmação no modal
    const deleteProductConfirmed = useCallback((code, description) => {
        setStock(prev => {
            const newStock = prev.filter(p => p.codigoProduto !== code);

            if (newStock.length < prev.length) {
                showFeedback('success', `Produto "${description}" excluído com sucesso!`);

                // Se o produto excluído era o selecionado para movimento, ajusta o select
                if (movement.productCode === code) {
                    setMovement(prevM => ({ ...prevM, productCode: newStock[0]?.codigoProduto || '' }));
                }
                return newStock;
            }
            showFeedback('danger', `Erro ao excluir produto. Código ${code} não encontrado.`);
            return prev;
        });
        closeModal();
    }, [movement.productCode]);


    // Abre o Modal de Confirmação para Exclusão (Substituindo window.confirm)
    const openConfirmModal = (product) => {
        setModalState({
            isOpen: true,
            type: 'confirm',
            productData: product
        });
    };

    // Abre o Modal de Edição
    const openEditModal = (code) => {
        const product = stock.find(p => p.codigoProduto === code);
        if (!product) { showFeedback('danger', `Erro: Produto com código ${code} não encontrado para edição.`); return; }
        setModalState({
            isOpen: true,
            type: 'edit',
            productData: product
        });
    };

    // Fecha qualquer modal
    const closeModal = () => {
        setModalState({ isOpen: false, type: null, productData: null });
    };

    const saveEditedProduct = (newEditData, originalCode) => {
        // Verifica se o novo código já existe e é diferente do código original
        const existingProduct = stock.find(p => p.codigoProduto === newEditData.codigoProduto && p.codigoProduto !== originalCode);
        if (existingProduct) {
            showFeedback('danger', `Erro: O novo código **${newEditData.codigoProduto}** já está em uso por outro produto ("${existingProduct.descricaoProduto}").`);
            return;
        }
        
        if(newEditData.codigoProduto <= 0) {
            showFeedback('danger', `Erro: O código do produto deve ser positivo.`);
            return;
        }

        setStock(prevStock => {
            const index = prevStock.findIndex(p => p.codigoProduto === originalCode);
            if (index === -1) return prevStock;

            const newStock = [...prevStock];
            newStock[index] = newEditData;
            return newStock;
        });

        // Atualiza o select de movimento se o código do produto for alterado
        if (originalCode !== newEditData.codigoProduto && movement.productCode === originalCode) {
            setMovement(prevM => ({ ...prevM, productCode: newEditData.codigoProduto }));
        }

        closeModal();
        showFeedback('success', `Produto "${newEditData.descricaoProduto}" (Cód: ${newEditData.codigoProduto}) atualizado com sucesso!`);
    };

    // Efeito para garantir que um produto esteja sempre selecionado se houver estoque
    useEffect(() => {
        if (!movement.productCode && stock.length > 0) {
            setMovement(prevM => ({ ...prevM, productCode: stock[0].codigoProduto }));
        }
    }, [stock, movement.productCode]);

    const exportToExcel = () => showFeedback('info', 'Função de exportação para Excel simulada (Requer SheetJS).');
    const exportToPDF = () => showFeedback('info', 'Função de exportação para PDF simulada (Requer html2canvas e jsPDF).');

    return (
        <section id="stock-section">
            <h2>📦 2. Gestão de Estoque (Movimentação, CRUD e Exportação)</h2>
            <div className="stock-form-grid">
                <div className="form-group">
                    <label htmlFor="productCode">Produto:</label>
                    <select id="productCode" value={movement.productCode} onChange={handleMovementChange}>
                        {stock.length === 0 && <option value="">Nenhum produto cadastrado</option>}
                        {stock.map(product => (
                            <option key={product.codigoProduto} value={product.codigoProduto}>
                                {product.codigoProduto} - {product.descricaoProduto}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="movementType">Tipo de Movimento:</label>
                    <select id="movementType" value={movement.movementType} onChange={handleMovementChange}>
                        <option value="entrada">ENTRADA (Aumenta)</option>
                        <option value="saida">SAÍDA (Diminui)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="quantity">Qtde:</label>
                    <input type="number" id="quantity" min="1" value={movement.quantity} onChange={handleMovementChange} />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Descrição (ID: <span id="movementIdDisplay">{movementIdCounter}</span>):</label>
                    <input type="text" id="description" value={movement.description} onChange={handleMovementChange} placeholder="ID Único / Descrição" />
                </div>
            </div>

            <button className="full-width-btn btn-primary" onClick={performMovement} disabled={stock.length === 0}>Lançar Movimentação</button>
            <div id="movementResult" className={`result-box result-${feedback.type}`} style={{ display: feedback.display ? 'block' : 'none' }} dangerouslySetInnerHTML={{ __html: feedback.message }} />

            <h3>Estoque Atualizado</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button className="full-width-btn btn-success" onClick={exportToExcel} style={{ flex: 1 }}>💾 Exportar para Excel</button>
                <button className="full-width-btn btn-danger" onClick={exportToPDF} style={{ flex: 1 }}>💾 Exportar para PDF</button>
            </div>

            <div id="stock-results">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '10%' }}>Cód. 🏷️</th>
                            <th style={{ width: '50%' }}>Descrição do Produto</th>
                            <th style={{ width: '15%' }}>Estoque Atual 🔢</th>
                            <th style={{ width: '25%', textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stock.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic', color: '#999' }}>Nenhum produto em estoque.</td>
                            </tr>
                        ) : (
                            stock.map(product => (
                                <tr key={product.codigoProduto}>
                                    <td>{product.codigoProduto}</td>
                                    <td>{product.descricaoProduto}</td>
                                    <td>{product.estoque}</td>
                                    <td>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            <button className="action-button edit" title="Editar Produto" onClick={() => openEditModal(product.codigoProduto)}>
                                                <span style={{ fontSize: '1.1em' }}>✏️</span>
                                            </button>
                                            <button className="action-button delete" title="Excluir Produto" onClick={() => openConfirmModal(product)}>
                                                <span style={{ fontSize: '1.1em' }}>🗑️</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {modalState.isOpen && modalState.type === 'edit' && (
                <EditModal
                    product={modalState.productData}
                    onClose={closeModal}
                    onSave={saveEditedProduct}
                />
            )}

            {modalState.isOpen && modalState.type === 'confirm' && (
                <EditModal
                    isConfirmation={true}
                    confirmMessage={`Tem certeza que deseja EXCLUIR o produto "${modalState.productData.descricaoProduto}" (Cód: ${modalState.productData.codigoProduto})? Esta ação é irreversível.`}
                    onClose={closeModal}
                    confirmAction={() => deleteProductConfirmed(modalState.productData.codigoProduto, modalState.productData.descricaoProduto)}
                />
            )}
        </section>
    );
};

// ==========================================================
// --- COMPONENTE DE SEÇÃO 3: JUROS ---
// ==========================================================
const InterestSection = () => {
    const [principalValue, setPrincipalValue] = useState(500.00);
    const [dueDate, setDueDate] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [result, setResult] = useState({ type: 'info', message: '', display: false });

    // Configura datas iniciais de demonstração (7 dias de atraso)
    useEffect(() => {
        const defaultPaymentDate = new Date();
        const defaultDueDate = new Date();
        
        // Pagamento: Hoje
        defaultPaymentDate.setDate(defaultPaymentDate.getDate()); 
        // Vencimento: 7 dias atrás
        defaultDueDate.setDate(defaultPaymentDate.getDate() - 7); 

        // Formata para YYYY-MM-DD
        const formatDate = (date) => date.toISOString().split('T')[0];

        setDueDate(formatDate(defaultDueDate));
        setPaymentDate(formatDate(defaultPaymentDate));
    }, []);

    const calculateInterest = () => {
        if (isNaN(principalValue) || principalValue <= 0 || !dueDate || !paymentDate) {
            setResult({ type: 'danger', message: 'Por favor, preencha o valor principal, a data de vencimento e a data de pagamento.', display: true });
            return;
        }

        const due = new Date(dueDate);
        const payment = new Date(paymentDate);
        due.setHours(0, 0, 0, 0);
        payment.setHours(0, 0, 0, 0);

        if (payment <= due) {
            setResult({ type: 'success', message: `🎉 Pagamento em dia (Data de Pagamento: ${payment.toLocaleDateString('pt-BR')})! Valor: **${formatCurrency(principalValue)}**. Nenhum juro ou multa aplicado.`, display: true });
            return;
        }

        // Cálculo dos dias de atraso (pagamento > vencimento)
        const timeDifference = payment.getTime() - due.getTime();
        // Math.round para evitar problemas de fuso horário em alguns casos
        const daysOverdue = Math.round(timeDifference / (1000 * 60 * 60 * 24)); 
        
        // --- Regras Padrão de Atraso no Brasil ---
        // 1. Multa Fixa (2% sobre o valor principal, cobrada uma vez)
        const fixedFineRate = 0.02; // 2%
        const fixedFineValue = principalValue * fixedFineRate;

        // 2. Juros de Mora (1% ao mês, calculado Pro Rata Die - 0.033% ao dia)
        const dailyInterestRate = 0.01 / 30; // 0.000333...
        const totalInterestValue = principalValue * dailyInterestRate * daysOverdue;
        
        // Total de Encargos
        const totalCharges = fixedFineValue + totalInterestValue;
        const totalValue = principalValue + totalCharges;

        const messageHtml = `
            <p><strong>Atraso: ${daysOverdue} dias</strong></p>
            <p>Vencimento: ${due.toLocaleDateString('pt-BR')} | Pagamento: ${payment.toLocaleDateString('pt-BR')}</p>
            <hr style="margin: 10px 0; background-color: #f5c6cb;">
            <p>Valor Principal: **${formatCurrency(principalValue)}**</p>
            <p>Multa Fixa (2%): **${formatCurrency(fixedFineValue)}**</p>
            <p>Juros de Mora (${(dailyInterestRate * 100).toFixed(4).replace('.', ',')}% ao dia por ${daysOverdue} dias): **${formatCurrency(totalInterestValue)}**</p>
            <p style="font-size: 1.1em; margin-top: 10px;"><strong>TOTAL A PAGAR: ${formatCurrency(totalValue)}</strong></p>
        `;
        setResult({ type: 'danger', message: messageHtml, display: true });
    };

    return (
        <section id="interest-section">
            <h2>⚠️ 3. Cálculo de Juros por Atraso (Multa e Juros de Mora)</h2>
            <p className="rules-text">Regra: **Multa Fixa (2%)** + **Juros de Mora (1% ao mês)** sobre o valor principal.</p>

            <div className="form-group">
                <label htmlFor="principalValue">Valor Original (R$):</label>
                <input
                    type="number"
                    id="principalValue"
                    min="0.01"
                    step="0.01"
                    value={principalValue}
                    onChange={(e) => setPrincipalValue(Number(e.target.value))}
                />
            </div>

            <div className="interest-form-grid">
                <div className="form-group">
                    <label htmlFor="dueDate">Data de Vencimento:</label>
                    <input type="date" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>

                <div className="form-group">
                    <label htmlFor="paymentDate">Data de Pagamento:</label>
                    <input type="date" id="paymentDate" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                </div>
            </div>

            <button className="full-width-btn btn-warning" onClick={calculateInterest}>Calcular Juros e Total</button>

            <div id="interestResult" className={`result-box result-${result.type}`} style={{ display: result.display ? 'block' : 'none' }} dangerouslySetInnerHTML={{ __html: result.message }} />
        </section>
    );
};


// ==========================================================
// --- COMPONENTE PRINCIPAL (APP) ---
// ==========================================================
export default function DesafioDev() {
    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />
            <div className="container">
                <h1>📊 Desafio Dev - Análise Financeira e Logística</h1>

                <CommissionsSection salesData={INITIAL_SALES_DATA} />

                <hr />

                <StockSection initialStock={INITIAL_STOCK_DATA} />

                <hr />

                <InterestSection />
            </div>
        </>
    );
}

// ==========================================================
// --- DADOS E ESTILOS LITERAIS PARA SIMPLICIDADE ---
// ==========================================================

const INITIAL_SALES_DATA = {
    vendas: [
        // Alta Comissão (>= R$500 -> 5%)
        { vendedor: 'Ana Paula', valor: 650.00 },
        { vendedor: 'Carlos Silva', valor: 1200.00 },
        { vendedor: 'Ana Paula', valor: 500.00 },
        // Média Comissão (R$100 a < R$500 -> 1%)
        { vendedor: 'Bianca Lima', valor: 250.00 },
        { vendedor: 'Carlos Silva', valor: 150.00 },
        { vendedor: 'Bianca Lima', valor: 499.99 },
        // Sem Comissão (< R$100 -> 0%)
        { vendedor: 'David Rocha', valor: 99.99 },
        { vendedor: 'David Rocha', valor: 50.00 },
        { vendedor: 'Ana Paula', valor: 800.00 },
        { vendedor: 'Carlos Silva', valor: 300.00 },
    ]
};

const INITIAL_STOCK_DATA = {
    estoque: [
        { codigoProduto: 1001, descricaoProduto: 'Notebook Gamer X-Pro', estoque: 45 },
        { codigoProduto: 1002, descricaoProduto: 'Monitor Curvo UltraWide', estoque: 120 },
        { codigoProduto: 1003, descricaoProduto: 'Teclado Mecânico RGB', estoque: 210 },
        { codigoProduto: 1004, descricaoProduto: 'Mouse Sem Fio Ergonômico', estoque: 88 }
    ]
};

const CSS_STYLES = `
    /* ESTILOS DE VARS E GERAIS */
    :root {
        --primary-color: #007bff;
        --secondary-color: #17a2b8;
        --success-color: #28a745;
        --warning-color: #ffc107;
        --danger-color: #dc3545;
        --background-light: #f8f9fa;
        --text-dark: #343a40;
        --border-light: #dee2e6;
    }

    body {
        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: var(--background-light);
        color: var(--text-dark);
        line-height: 1.6;
        min-height: 100vh;
    }

    .container {
        max-width: 900px;
        margin: auto;
        background: #ffffff;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    h1 {
        color: var(--primary-color);
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 3px solid var(--primary-color);
        padding-bottom: 10px;
    }

    hr {
        border: 0;
        height: 1px;
        background-color: #ccc;
        margin: 30px 0;
    }

    section {
        background-color: #ffffff;
        padding: 25px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        margin-bottom: 20px;
    }

    section#comissions-section { border-left: 5px solid var(--success-color); }
    section#stock-section { border-left: 5px solid var(--secondary-color); }
    section#interest-section { border-left: 5px solid var(--warning-color); }

    h2 {
        color: var(--text-dark);
        margin-top: 0;
        margin-bottom: 20px;
        font-size: 1.5em;
    }
    
    .rules-text {
        font-size: 0.9em;
        color: #6c757d;
        font-style: italic;
        margin-top: -10px;
        margin-bottom: 20px;
        padding: 5px 10px;
        background-color: #f1f1f1;
        border-radius: 4px;
    }

    h3 {
        color: var(--secondary-color);
        margin-top: 25px;
        margin-bottom: 15px;
        border-bottom: 1px dashed var(--border-light);
        padding-bottom: 5px;
    }

    /* ESTILOS DE TABELA */
    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-top: 15px;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }

    th, td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid var(--border-light);
    }

    th {
        background-color: var(--primary-color);
        color: white;
        font-weight: 600;
        text-transform: uppercase;
    }

    tr:nth-child(even) {
        background-color: #f3f3f3;
    }

    tr:hover {
        background-color: #e9ecef;
    }

    .total-row {
        background-color: #cce5ff !important;
        font-weight: bold;
        color: var(--primary-color);
    }

    /* ESTILOS DE FORMULÁRIO */
    .form-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 15px;
    }

    label {
        font-weight: bold;
        margin-bottom: 5px;
        color: #555;
    }

    input[type="number"], input[type="text"], input[type="date"], select {
        padding: 10px;
        border: 1px solid var(--border-light);
        border-radius: 5px;
        width: 100%;
        box-sizing: border-box;
        font-size: 1em;
        transition: border-color 0.3s;
    }

    input:focus, select:focus {
        border-color: var(--secondary-color);
        outline: none;
    }

    .stock-form-grid, .interest-form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
    }
    .interest-form-grid { grid-template-columns: 1fr 1fr; }

    /* ESTILOS DE BOTÕES E RESULTADOS */
    .action-button {
        padding: 8px 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s ease, transform 0.1s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9em;
        margin: 0 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .action-button:active { transform: translateY(1px); }
    .action-button.edit { background-color: #ffeb3b; color: var(--text-dark); }
    .action-button.edit:hover { background-color: #fdd835; }
    .action-button.delete { background-color: var(--danger-color); color: white; }
    .action-button.delete:hover { background-color: #c82333; }

    button.full-width-btn {
        padding: 12px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s ease, transform 0.1s;
        margin-top: 10px;
        width: 100%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .btn-primary { background-color: var(--secondary-color); color: white; }
    .btn-primary:hover:not(:disabled) { background-color: #117a8b; }
    .btn-warning { background-color: var(--warning-color); color: var(--text-dark); }
    .btn-warning:hover:not(:disabled) { background-color: #e0a800; }
    .btn-danger { background-color: var(--danger-color); color: white; }
    .btn-danger:hover:not(:disabled) { background-color: #c82333; }
    .btn-success { background-color: var(--success-color); color: white; }
    .btn-success:hover:not(:disabled) { background-color: #1e7e34; }
    .btn-secondary { background-color: #6c757d; color: white; }
    .btn-secondary:hover:not(:disabled) { background-color: #5a6268; }
    
    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .result-box {
        margin-top: 15px;
        padding: 15px;
        border-radius: 5px;
        font-weight: 600;
        text-align: center;
        line-height: 1.4;
    }
    .result-box p { margin: 5px 0; }
    
    /* Continuando a partir do ponto de corte */
    .result-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .result-danger { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .result-info { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }

    /* ESTILOS DE GRÁFICO */
    #commissionChart {
        margin-top: 25px;
        padding-top: 10px;
        border-top: 1px solid var(--border-light);
    }
    .chart-bar-container {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }
    .chart-label {
        width: 150px;
        font-weight: 500;
        padding-right: 10px;
        text-align: right;
        font-size: 0.9em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .chart-bar {
        height: 25px;
        background-color: var(--success-color);
        border-radius: 4px;
        transition: width 0.5s ease-out;
        display: flex;
        align-items: center;
        padding: 0 5px;
        min-width: 30px; /* Garante que o valor seja visível */
    }
    .chart-bar-value {
        color: white;
        font-size: 0.8em;
        font-weight: bold;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.4);
    }

    /* ESTILOS DE MODAL (SUBSTITUINDO ALERT/CONFIRM) */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    .modal-content {
        background: white;
        padding: 25px;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        animation: fadeIn 0.3s;
    }
    .small-modal { max-width: 400px; }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-light);
        padding-bottom: 10px;
        margin-bottom: 20px;
    }
    .modal-header h2 {
        margin: 0;
        font-size: 1.4em;
    }
    .modal-close-btn {
        background: none;
        border: none;
        font-size: 1.5em;
        cursor: pointer;
        color: #666;
        transition: color 0.2s;
        line-height: 1;
    }
    .modal-close-btn:hover { color: var(--danger-color); }
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* Responsividade */
    @media (max-width: 600px) {
        .container {
            padding: 15px;
            margin: 10px;
        }
        .stock-form-grid, .interest-form-grid {
            grid-template-columns: 1fr;
        }
        th, td {
            padding: 8px 10px;
            font-size: 0.9em;
        }
        .chart-label {
            width: 80px;
        }
        .chart-bar-container {
            flex-direction: column;
            align-items: flex-start;
        }
        .chart-label {
            text-align: left;
            width: 100%;
            padding-bottom: 3px;
        }
        .chart-bar {
            width: 100% !important;
        }
    }
`;