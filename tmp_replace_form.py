from pathlib import Path

path = Path('src/components/AddResidenceForm.jsx')
text = path.read_text()
needle = "      <form onSubmit={handleSubmit}>\n"
start = text.find(needle)
if start == -1:
  raise SystemExit("form start not found")
end = text.find("      </form>", start)
if end == -1:
  raise SystemExit("form end not found")
new_block = """      <form onSubmit={handleSubmit}>
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px' }}>// OWNER / ENTITY</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Owner / Entity</label><input className="modern-input" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Jane Investor / Oak Holdings LLC" /></div>
            <div className="input-group">
              <label className="input-label">Entity Type</label>
              <select className="modern-input" name="owningEntityType" value={formData.owningEntityType} onChange={handleChange}>
                <option value="Individual">Individual</option>
                <option value="LLC">LLC</option>
              </select>
            </div>
            <div className="input-group"><label className="input-label">LLC Name</label><input className="modern-input" name="llcName" value={formData.llcName} onChange={handleChange} placeholder="If different from owner" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px', marginTop: '20px' }}>
            <div className="input-group"><label className="input-label">Owner Phone</label><input className="modern-input" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} placeholder="(555) 123-4567" /></div>
            <div className="input-group"><label className="input-label">Owner Email</label><input className="modern-input" type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} placeholder="owner@email.com" /></div>
          </div>
          <div className="input-group"><label className="input-label">Mailing Address</label><input className="modern-input" name="ownerMailingAddress" value={formData.ownerMailingAddress} onChange={handleChange} placeholder="123 Any St, Suite 100" /></div>
          <div className="input-group">
            <label className="input-label">Data Sources</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {DATA_SOURCE_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => toggleDataSource(option)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border: '1px solid var(--glass-border)',
                    background: formData.dataSources.includes(option) ? 'var(--accent-purple)' : 'transparent',
                    color: formData.dataSources.includes(option) ? '#0b1120' : 'var(--text-primary)',
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', marginTop: '10px', gap: '10px', flexWrap: 'wrap' }}>
              <input className="modern-input" placeholder="Add custom source" value={customSource} onChange={(e) => setCustomSource(e.target.value)} />
              <button type="button" className="btn-modern-subtle" onClick={handleCustomSourceAdd}>Add</button>
            </div>
          </div>
        </section>

        <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.3, marginBottom: '30px' }} />

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-purple)', marginBottom: '15px' }}>// PROPERTY SNAPSHOT</h3>
          <div className="input-group"><label className="input-label">Street Address</label><input className="modern-input" name="propertyAddress" value={formData.propertyAddress} required onChange={handleChange} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">City</label><input className="modern-input" name="propertyCity" value={formData.propertyCity} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">State</label><input className="modern-input" name="propertyState" value={formData.propertyState} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">ZIP</label><input className="modern-input" name="propertyZip" value={formData.propertyZip} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">County</label><input className="modern-input" name="propertyCounty" value={formData.propertyCounty} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">APN</label><input className="modern-input" name="propertyApn" value={formData.propertyApn} onChange={handleChange} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Year Built</label><input className="modern-input" type="number" name="yearBuilt" value={formData.yearBuilt} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Square Footage</label><input className="modern-input" type="number" name="squareFootage" value={formData.squareFootage} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Beds</label><input className="modern-input" name="beds" value={formData.beds} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Baths</label><input className="modern-input" name="baths" value={formData.baths} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Lot Size</label><input className="modern-input" name="lotSize" value={formData.lotSize} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Zoning</label><input className="modern-input" name="zoning" value={formData.zoning} onChange={handleChange} /></div>
          </div>
        </section>

        <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.3, marginBottom: '30px' }} />

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-green)', marginBottom: '15px' }}>// ACQUISITION HISTORY</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Date Purchased</label><input className="modern-input" type="date" name="datePurchased" value={formData.datePurchased} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Last Sale Price ($)</label><input className="modern-input" type="number" name="lastSalePrice" value={formData.lastSalePrice} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Last Sale Date</label><input className="modern-input" type="date" name="lastSaleDate" value={formData.lastSaleDate} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Recorded Closing Costs ($)</label><input className="modern-input" type="number" name="closingCosts" value={formData.closingCosts} onChange={handleChange} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Seller / Transfer</label><input className="modern-input" name="sellerName" value={formData.sellerName} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Recorded Deed Link</label><input className="modern-input" type="url" name="recordedDeedLink" value={formData.recordedDeedLink} onChange={handleChange} placeholder="https://..." /></div>
          </div>
        </section>

        <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.3, marginBottom: '30px' }} />

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-green)', marginBottom: '15px' }}>// DEAL PIPELINE</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Asking Price ($)</label><input className="modern-input" type="number" name="askingPrice" value={formData.askingPrice} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Lead Source</label><input className="modern-input" name="leadSource" value={formData.leadSource} onChange={handleChange} placeholder="Outbound, inbound, referral..." /></div>
            <div className="input-group"><label className="input-label">Seller Motivation</label><input className="modern-input" name="motivation" value={formData.motivation} onChange={handleChange} /></div>
            <div className="input-group">
              <label className="input-label">Project Strategy</label>
              <select className="modern-input" name="projectStrategy" value={formData.projectStrategy} onChange={handleChange}>
                <option value="BRRR">BRRR</option>
                <option value="Flip">Flip</option>
                <option value="Rental">Rental</option>
              </select>
            </div>
          </div>
          <div className="input-group"><label className="input-label">Working Notes</label><textarea className="modern-input" rows="3" name="notes" value={formData.notes} onChange={handleChange} /></div>
        </section>

        <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.3, marginBottom: '30px' }} />

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px' }}>// BRRR INPUTS</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
            <div style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)' }}><span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Estimated Rehab</span><strong>{formatCurrency(rehabBudgetEstimate)}</strong></div>
            <div style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)' }}><span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Blended Rent</span><strong>{formatCurrency(blendedRent)}</strong></div>
            <div style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)' }}><span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Holding (monthly)</span><strong>{formatCurrency((Number(formData.purchasePrice) || 0) * ((Number(formData.holdingPercent) || 0) / 100))}</strong></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Purchase Price ($)</label><input className="modern-input" type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">After Repair Value ($)</label><input className="modern-input" type="number" name="arv" value={formData.arv} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Rehab Timeline (months)</label><input className="modern-input" type="number" name="rehabTimeline" value={formData.rehabTimeline} onChange={handleChange} /></div>
          </div>
          <div className="input-group">
            <label className="input-label">Rehab Budget Entry</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => handleRehabModeChange('percent')} style={{ padding: '6px 14px', borderRadius: '999px', border: '1px solid var(--glass-border)', background: formData.rehabBudgetMode === 'percent' ? 'var(--accent-green)' : 'transparent', color: formData.rehabBudgetMode === 'percent' ? '#0b1120' : 'var(--text-primary)' }}>% of Purchase</button>
              <button type="button" onClick={() => handleRehabModeChange('dollar')} style={{ padding: '6px 14px', borderRadius: '999px', border: '1px solid var(--glass-border)', background: formData.rehabBudgetMode === 'dollar' ? 'var(--accent-green)' : 'transparent', color: formData.rehabBudgetMode === 'dollar' ? '#0b1120' : 'var(--text-primary)' }}>$ Amount</button>
            </div>
            {formData.rehabBudgetMode === 'percent' ? (
              <input className="modern-input" type="number" step="0.1" name="rehabBudgetPercent" value={formData.rehabBudgetPercent} onChange={handleChange} placeholder="Percent of purchase" />
            ) : (
              <input className="modern-input" type="number" name="rehabBudgetAbsolute" value={formData.rehabBudgetAbsolute} onChange={handleChange} placeholder="Total rehab dollars" />
            )}
            <small style={{ color: 'var(--text-secondary)' }}>Est. Rehab Budget {formatCurrency(rehabBudgetEstimate)}</small>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Closing Costs %</label><input className="modern-input" type="number" step="0.1" name="closingCostsPercent" value={formData.closingCostsPercent} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Inspection / Misc %</label><input className="modern-input" type="number" step="0.1" name="inspectionPercent" value={formData.inspectionPercent} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Holding Monthly %</label><input className="modern-input" type="number" step="0.1" name="holdingPercent" value={formData.holdingPercent} onChange={handleChange} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Taxes / Year ($)</label><input className="modern-input" type="number" name="propertyTax" value={formData.propertyTax} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Insurance / Year ($)</label><input className="modern-input" type="number" name="insurance" value={formData.insurance} onChange={handleChange} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Market Rent ($/mo)</label><input className="modern-input" type="number" name="rentMonthly" value={formData.rentMonthly} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Other Income ($/mo)</label><input className="modern-input" type="number" name="otherIncomeMonthly" value={formData.otherIncomeMonthly} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Vacancy %</label><input className="modern-input" type="number" step="0.1" name="vacancyPercent" value={formData.vacancyPercent} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">OpEx %</label><input className="modern-input" type="number" step="0.1" name="opExPercent" value={formData.opExPercent} onChange={handleChange} placeholder="Leave blank to use defaults" /></div>
          </div>
          <div className="input-group">
            <label className="input-label">Funding Track</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {FUNDING_MODES.map(({ label, value }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => handleFundingModeSelect(value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    border: '1px solid var(--glass-border)',
                    background: formData.fundingMode === value ? 'var(--accent-green)' : 'transparent',
                    color: formData.fundingMode === value ? '#0b1120' : 'var(--text-primary)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Bridge LTV %</label><input className="modern-input" type="number" step="0.1" name="bridgeLtvPercent" value={formData.bridgeLtvPercent} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Refi LTV %</label><input className="modern-input" type="number" step="0.1" name="dscrRefiLtvPercent" value={formData.dscrRefiLtvPercent} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Refi Rate %</label><input className="modern-input" type="number" step="0.01" name="dscrRefiRatePercent" value={formData.dscrRefiRatePercent} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Amort Years</label><input className="modern-input" type="number" name="dscrRefiAmortYears" value={formData.dscrRefiAmortYears} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">DSCR Min</label><input className="modern-input" type="number" step="0.05" name="dscrRefiTarget" value={formData.dscrRefiTarget} onChange={handleChange} /></div>
          </div>
        </section>

        <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.3, marginBottom: '30px' }} />

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-green)', marginBottom: '15px' }}>// REHAB DETAIL (OPTIONAL)</h3>
          {formData.rehabItems.map((item, index) => (
            <div key={index} className="owner-group" style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '15px', marginBottom: '10px', position: 'relative' }}>
              {formData.rehabItems.length > 1 && <XCircle color="#f87171" size={20} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer' }} onClick={() => removeRehabItem(index)} />}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px' }}>
                <div className="input-group"><label className="input-label">Category</label><select className="modern-input" name="category" value={item.category} onChange={(e) => handleRehabChange(index, e)}><option>Exterior</option><option>Interior</option><option>General</option><option>Permits</option></select></div>
                <div className="input-group"><label className="input-label">Scope</label><input className="modern-input" name="name" value={item.name} onChange={(e) => handleRehabChange(index, e)} /></div>
                <div className="input-group"><label className="input-label">Cost ($)</label><input className="modern-input" type="number" name="cost" value={item.cost} onChange={(e) => handleRehabChange(index, e)} /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addRehabItem} className="btn-modern-subtle"><PlusCircle size={16} /> Add Line Item</button>
        </section>

        <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.3, marginBottom: '30px' }} />

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-purple)', marginBottom: '15px' }}>// RENT ROLL</h3>
          {formData.rentRoll.map((unit, index) => (
            <div key={index} className="owner-group" style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '15px', marginBottom: '15px', position: 'relative' }}>
              {formData.rentRoll.length > 1 && <XCircle color="#f87171" size={20} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer' }} onClick={() => removeRentRollUnit(index)} />}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="input-group"><label className="input-label">Label</label><input className="modern-input" value={unit.label} onChange={(e) => handleRentRollChange(index, 'label', e.target.value)} /></div>
                <div className="input-group"><label className="input-label">Rent ($)</label><input className="modern-input" type="number" value={unit.rent} onChange={(e) => handleRentRollChange(index, 'rent', e.target.value)} /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addRentRollUnit} className="btn-modern-subtle"><PlusCircle size={16} /> Add Unit</button>
        </section>

        <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.3, marginBottom: '30px' }} />

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-purple)', marginBottom: '15px' }}>// CAPITAL STACK</h3>
          {formData.loans.map((loan, index) => (
            <div key={index} className="owner-group" style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '15px', marginBottom: '20px', position: 'relative' }}>
              {formData.loans.length > 1 && <XCircle color="#f87171" size={20} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer' }} onClick={() => removeLoan(index)} />}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px' }}>
                <div className="input-group"><label className="input-label">Loan Amount ($)</label><input className="modern-input" type="number" name="loanAmount" value={loan.loanAmount} onChange={(e) => handleLoanChange(index, e)} /></div>
                <div className="input-group"><label className="input-label">Interest Rate (%)</label><input className="modern-input" type="number" step="0.01" name="interestRate" value={loan.interestRate} onChange={(e) => handleLoanChange(index, e)} /></div>
                <div className="input-group"><label className="input-label">Term (years)</label><input className="modern-input" type="number" name="term" value={loan.term} onChange={(e) => handleLoanChange(index, e)} /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addLoan} className="btn-modern-subtle"><PlusCircle size={16} /> Add Loan</button>
        </section>

        <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.3, marginBottom: '30px' }} />

        <section>
          <h3 style={{ color: 'var(--accent-purple)' }}>// IMAGES (UP TO 8)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
            {imageSlots.map((slot, index) => (
              <div key={index} className="image-slot">
                {slot ? (
                  <>
                    <img src={slot.url} alt={`Upload preview ${index + 1}`} />
                    <button type="button" className="remove-image-btn" onClick={() => removeImage(index)}><XCircle size={20} /></button>
                  </>
                ) : (
                  <label className="upload-label">
                    <ImagePlus size={30} />
                    <span>Add Image</span>
                    <input type="file" accept="image/*" multiple onChange={(e) => handleImageChange(index, e)} />
                  </label>
                )}
              </div>
            ))}
          </div>
        </section>

        <button type="submit" className="btn-modern" disabled={loading} style={{ width: '100%', marginTop: '30px', fontSize: '1.1rem' }}>
          {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {residenceToEdit ? 'UPDATE RESIDENCE' : 'SAVE RESIDENCE'}</>}
        </button>
      </form>
"""

text = text[:start] + new_block + text[end+len("      </form>"):]
path.write_text(text)
